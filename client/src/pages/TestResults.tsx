import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionReview } from "@/components/QuestionReview";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Home, Download, RotateCw } from "lucide-react";

export default function TestResults() {
  const { submissionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [reviewQuestion, setReviewQuestion] = useState<any>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  
  // Get takerId from session storage
  const takerId = parseInt(sessionStorage.getItem("takerId") || "0");
  
  // Fetch submission data
  const { data: submission, isLoading: isSubmissionLoading } = useQuery({
    queryKey: [`/api/submissions/${submissionId}`],
    queryFn: async () => {
      const res = await fetch(`/api/submissions/${submissionId}`);
      if (!res.ok) throw new Error("Failed to fetch submission");
      return res.json();
    },
    enabled: !!submissionId,
  });
  
  // Fetch test data
  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: ['/api/tests', submission?.testId],
    queryFn: async () => {
      const res = await fetch(`/api/tests/${submission?.testId}`);
      if (!res.ok) throw new Error("Failed to fetch test");
      return res.json();
    },
    enabled: !!submission?.testId,
  });
  
  // Submit review request mutation
  const reviewRequestMutation = useMutation({
    mutationFn: async (data: { submissionId: number; questionId: string; requestMessage: string; status: string }) => {
      const res = await apiRequest("POST", "/api/review-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/submissions/${submissionId}`] });
      toast({
        title: "تم إرسال طلب المراجعة",
        description: "سيتم مراجعة إجابتك في أقرب وقت",
      });
      setReviewDialogOpen(false);
      setReviewComment("");
      
      // Update submission to indicate it has a review request
      const updatedSubmission = { ...submission, hasReviewRequest: true };
      queryClient.setQueryData([`/api/submissions/${submissionId}`], updatedSubmission);
    },
    onError: (error) => {
      toast({
        title: "خطأ في إرسال طلب المراجعة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Calculate duration
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    const minutes = durationInMinutes % 60;
    const hours = Math.floor(durationInMinutes / 60);
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };
  
  const handleRequestReview = (questionId: string) => {
    const question = test?.questions.find(q => q.id === questionId);
    if (!question) return;
    
    const answer = submission?.answers.find(a => a.questionId === questionId);
    if (!answer) return;
    
    setReviewQuestion({ question, answer });
    setReviewDialogOpen(true);
  };
  
  const submitReviewRequest = () => {
    if (!reviewQuestion || !submissionId) return;
    
    reviewRequestMutation.mutate({
      submissionId: parseInt(submissionId),
      questionId: reviewQuestion.question.id,
      requestMessage: reviewComment,
      status: "pending",
    });
  };
  
  const handleDownloadResults = () => {
    // In a real app, this would generate a PDF or similar
    toast({
      title: "تم تنزيل النتائج",
      description: "تم تنزيل نتائج الاختبار بنجاح",
    });
  };
  
  if (isSubmissionLoading || isTestLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-lg">جاري تحميل النتائج...</p>
      </div>
    );
  }
  
  if (!submission || !test) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-lg text-red-500">حدث خطأ في تحميل النتائج. يرجى المحاولة مرة أخرى.</p>
        <Button 
          className="mt-4" 
          onClick={() => setLocation("/")}
        >
          العودة للرئيسية
        </Button>
      </div>
    );
  }
  
  const percentageScore = Math.round((submission.score / submission.totalPoints) * 100);
  const duration = calculateDuration(submission.startTime, submission.endTime);
  const correctAnswers = submission.answers.filter(answer => answer.isCorrect).length;
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Results Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">نتائج الاختبار</h2>
            <p className="text-lg text-gray-600 mb-6">{test.title}</p>
            
            <div className="flex flex-wrap justify-center gap-10 mb-4">
              <div className="text-center">
                <span className="block text-sm text-gray-500">النتيجة</span>
                <span className={`block text-3xl font-semibold ${
                  percentageScore >= 70 
                    ? 'text-green-600' 
                    : percentageScore >= 50 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                }`}>
                  {percentageScore}%
                </span>
                <span className="text-sm text-gray-500">
                  {submission.score} / {submission.totalPoints} درجة
                </span>
              </div>
              <div className="text-center">
                <span className="block text-sm text-gray-500">الوقت المستغرق</span>
                <span className="block text-3xl font-semibold text-gray-900">
                  {duration}
                </span>
                <span className="text-sm text-gray-500">
                  من أصل {test.duration} دقيقة
                </span>
              </div>
              <div className="text-center">
                <span className="block text-sm text-gray-500">الإجابات الصحيحة</span>
                <span className="block text-3xl font-semibold text-green-600">
                  {correctAnswers}
                </span>
                <span className="text-sm text-gray-500">
                  من أصل {test.questions.length} أسئلة
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Questions Review */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">مراجعة الأسئلة والإجابات</h3>
          
          <div className="space-y-8">
            {test.questions.map((question, index) => {
              const answer = submission.answers.find(a => a.questionId === question.id);
              if (!answer) return null;
              
              return (
                <QuestionReview
                  key={question.id}
                  question={question}
                  answer={answer}
                  onRequestReview={handleRequestReview}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-center gap-4 mb-8">
        <Button 
          onClick={() => setLocation("/")}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Home className="mr-2 h-4 w-4" /> العودة للرئيسية
        </Button>
        <Button 
          variant="outline"
          onClick={handleDownloadResults}
        >
          <Download className="mr-2 h-4 w-4" /> تنزيل النتائج
        </Button>
      </div>
      
      {/* Review Request Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>طلب مراجعة السؤال</DialogTitle>
            <DialogDescription>
              يرجى توضيح سبب طلب المراجعة لهذا السؤال
            </DialogDescription>
          </DialogHeader>
          
          {reviewQuestion && (
            <div className="py-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700">السؤال:</h4>
                <p className="mt-1 text-gray-900">{reviewQuestion.question.text}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700">إجابتك:</h4>
                <p className="mt-1 text-gray-900">
                  {reviewQuestion.question.type === "essay" 
                    ? reviewQuestion.answer.essayAnswer 
                    : reviewQuestion.question.type === "mcq" && reviewQuestion.question.choices
                      ? reviewQuestion.question.choices[reviewQuestion.answer.choiceIndex]
                      : reviewQuestion.question.type === "tf"
                        ? reviewQuestion.answer.booleanAnswer ? "صح" : "خطأ"
                        : ""}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700">سبب طلب المراجعة:</h4>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="اكتب سبب طلب المراجعة هنا..."
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReviewDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              onClick={submitReviewRequest}
              disabled={!reviewComment.trim() || reviewRequestMutation.isPending}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {reviewRequestMutation.isPending ? (
                <>جاري الإرسال...</>
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" /> إرسال طلب المراجعة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
