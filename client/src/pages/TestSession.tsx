import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionDisplay } from "@/components/QuestionDisplay";
import { Answer, Question } from "@shared/schema";
import { ChevronRight, ChevronLeft, Flag, CheckCircle } from "lucide-react";

export default function TestSession() {
  const { shareCode } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get takerId from session storage
  const takerId = parseInt(sessionStorage.getItem("takerId") || "0");
  
  // Fetch test data
  const { data: test, isLoading, error } = useQuery({
    queryKey: [`/api/tests/share/${shareCode}`],
    queryFn: async () => {
      const res = await fetch(`/api/tests/share/${shareCode}`);
      if (!res.ok) throw new Error("Failed to fetch test");
      return res.json();
    },
  });
  
  // Initialize answers when test data is loaded
  useEffect(() => {
    if (test?.questions) {
      // Initialize answers for all questions
      const initialAnswers = test.questions.map((question: Question) => ({
        questionId: question.id,
        choiceIndex: question.type === "mcq" ? -1 : undefined,
        booleanAnswer: question.type === "tf" ? undefined : undefined,
        essayAnswer: question.type === "essay" ? "" : undefined,
        isCorrect: undefined,
        points: 0,
        reviewRequested: false,
      }));
      setAnswers(initialAnswers);
      
      // Set remaining time based on test duration
      setRemainingTime(test.duration * 60);
      
      // Set start time
      setStartTime(new Date());
    }
  }, [test]);
  
  // Timer countdown
  useEffect(() => {
    if (remainingTime <= 0 || !test) return;
    
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [remainingTime, test]);
  
  // Format remaining time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };
  
  // Update answer for the current question
  const updateAnswer = (answer: Partial<Answer>) => {
    setAnswers((prevAnswers) => 
      prevAnswers.map((prevAnswer, index) => 
        index === currentQuestionIndex 
          ? { ...prevAnswer, ...answer } 
          : prevAnswer
      )
    );
  };
  
  // Navigate to the next question
  const goToNextQuestion = () => {
    if (currentQuestionIndex < (test?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Navigate to the previous question
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Toggle flagged status of current question
  const toggleFlagQuestion = () => {
    setFlaggedQuestions((prevFlagged) => {
      const newFlagged = new Set(prevFlagged);
      if (newFlagged.has(currentQuestionIndex)) {
        newFlagged.delete(currentQuestionIndex);
      } else {
        newFlagged.add(currentQuestionIndex);
      }
      return newFlagged;
    });
  };
  
  // Go to a specific question
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < (test?.questions?.length || 0)) {
      setCurrentQuestionIndex(index);
    }
  };
  
  // Check if a question has been answered
  const isQuestionAnswered = (index: number) => {
    if (!answers[index]) return false;
    
    const answer = answers[index];
    const question = test?.questions[index];
    
    if (!question) return false;
    
    switch (question.type) {
      case "mcq":
        return answer.choiceIndex !== undefined && answer.choiceIndex >= 0;
      case "tf":
        return answer.booleanAnswer !== undefined;
      case "essay":
        return !!answer.essayAnswer && answer.essayAnswer.trim() !== "";
      default:
        return false;
    }
  };
  
  // Calculate scores for multiple choice and true/false questions
  const calculateScores = useCallback(() => {
    if (!test?.questions || !answers) return;
    
    return answers.map((answer, index) => {
      const question = test.questions[index];
      
      if (!question) return answer;
      
      let isCorrect = false;
      let points = 0;
      
      switch (question.type) {
        case "mcq":
          isCorrect = answer.choiceIndex === question.correctChoice;
          break;
        case "tf":
          isCorrect = answer.booleanAnswer === question.correctAnswer;
          break;
        case "essay":
          // For essay questions, check if the answer matches any of the model answers
          if (answer.essayAnswer && question.modelAnswers) {
            // This is a very simple check - in a real app, you would want more sophisticated matching
            isCorrect = question.modelAnswers.some(
              modelAnswer => answer.essayAnswer?.toLowerCase().includes(modelAnswer.toLowerCase())
            );
          }
          break;
      }
      
      // Assign points based on correctness
      points = isCorrect ? question.points : 0;
      
      return {
        ...answer,
        isCorrect,
        points,
      };
    });
  }, [test, answers]);
  
  // Submit the test
  const handleSubmitTest = async () => {
    if (!test || !takerId || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate scores
      const scoredAnswers = calculateScores() || [];
      
      // Calculate total score and total points
      const totalScore = scoredAnswers.reduce((sum, answer) => sum + (answer.points || 0), 0);
      const totalPoints = test.questions.reduce((sum, question) => sum + question.points, 0);
      
      // Create submission - يجب التأكد من أن كل الحقول مطابقة للسكيما المتوقعة
      const submissionData = {
        testId: test.id,
        takerId,
        answers: scoredAnswers,
        startTime: startTime?.toISOString() || new Date().toISOString(),
        endTime: new Date().toISOString(),
        score: totalScore,
        totalPoints,
        hasReviewRequest: false,
      };

      console.log("Submission data:", JSON.stringify(submissionData, null, 2));
      
      // تعديل طريقة إرسال البيانات لتسليم الاختبار
      console.log("إرسال البيانات للخادم...");
      
      // تأكد من تحويل التواريخ إلى السلاسل النصية بشكل صحيح
      const submissionWithCorrectDates = {
        ...submissionData,
        startTime: submissionData.startTime.toString(),
        endTime: submissionData.endTime.toString()
      };
      
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionWithCorrectDates),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit test");
      }
      
      const submission = await response.json();
      
      // Redirect to results page
      setLocation(`/test-results/${submission.id}`);
    } catch (error) {
      console.error("Error submitting test:", error);
      toast({
        title: "خطأ في تسليم الاختبار",
        description: "حدث خطأ أثناء تسليم الاختبار. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-lg">جاري تحميل الاختبار...</p>
      </div>
    );
  }
  
  if (error || !test) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-lg text-red-500">حدث خطأ في تحميل الاختبار. يرجى التحقق من الرابط والمحاولة مرة أخرى.</p>
        <Button 
          className="mt-4" 
          onClick={() => setLocation("/take-test")}
        >
          العودة
        </Button>
      </div>
    );
  }
  
  if (!takerId) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-lg text-yellow-500">يجب إدخال اسمك أولاً قبل إجراء الاختبار.</p>
        <Button 
          className="mt-4" 
          onClick={() => setLocation("/take-test")}
        >
          إدخال الاسم
        </Button>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Test Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{test.title}</h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                <span className="font-medium">الوقت المتبقي:</span>
                <span className="font-bold text-red-600 mr-1">{formatTime(remainingTime)}</span>
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-medium">السؤال:</span>
                <span className="font-bold mr-1">
                  {currentQuestionIndex + 1} / {test.questions.length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Question Display */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {currentQuestion && currentAnswer && (
            <QuestionDisplay
              question={currentQuestion}
              answer={currentAnswer}
              onChange={updateAnswer}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mb-6">
        <Button
          variant="outline"
          onClick={goToPrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronRight className="ml-2 h-4 w-4" /> السؤال السابق
        </Button>
        <Button
          variant="outline"
          onClick={toggleFlagQuestion}
          className={flaggedQuestions.has(currentQuestionIndex) ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100" : ""}
        >
          <Flag className="ml-2 h-4 w-4" /> 
          {flaggedQuestions.has(currentQuestionIndex) ? "إزالة العلامة" : "علم للمراجعة"}
        </Button>
        <Button
          variant="default"
          onClick={goToNextQuestion}
          disabled={currentQuestionIndex === test.questions.length - 1}
        >
          السؤال التالي <ChevronLeft className="mr-2 h-4 w-4" />
        </Button>
      </div>
      
      {/* Questions Sidebar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="text-md font-medium text-gray-900 mb-3">أسئلة الاختبار</h3>
          <div className="grid grid-cols-10 gap-2">
            {test.questions.map((_, index) => (
              <Button
                key={index}
                variant="outline"
                className={`h-8 w-8 p-0 ${
                  currentQuestionIndex === index
                    ? "bg-primary-100 border-2 border-primary-500 text-primary-800"
                    : flaggedQuestions.has(index)
                    ? "bg-yellow-100 text-yellow-800"
                    : isQuestionAnswered(index)
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-200 text-gray-800"
                }`}
                onClick={() => goToQuestion(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-gray-200"></div>
              <span className="mr-2 text-xs text-gray-600">لم تتم الإجابة</span>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-green-100"></div>
              <span className="mr-2 text-xs text-gray-600">تمت الإجابة</span>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-yellow-100"></div>
              <span className="mr-2 text-xs text-gray-600">معلم للمراجعة</span>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-primary-100 border-2 border-primary-500"></div>
              <span className="mr-2 text-xs text-gray-600">السؤال الحالي</span>
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              onClick={handleSubmitTest}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              <CheckCircle className="ml-2 h-4 w-4" /> 
              {isSubmitting ? "جاري الإرسال..." : "إنهاء الاختبار وإرسال الإجابات"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
