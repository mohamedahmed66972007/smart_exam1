import { Question, Answer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { QuestionDisplay } from "./QuestionDisplay";
import { Check, X, AlertCircle, RefreshCw } from "lucide-react";

interface QuestionReviewProps {
  question: Question;
  answer: Answer;
  onRequestReview: (questionId: string) => void;
}

export function QuestionReview({ question, answer, onRequestReview }: QuestionReviewProps) {
  const isCorrect = answer.isCorrect;
  const reviewRequested = answer.reviewRequested;
  
  const getStatusBadge = () => {
    if (reviewRequested) {
      return (
        <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
          <AlertCircle className="mr-1 h-3 w-3" /> تحت المراجعة
        </span>
      );
    }
    
    if (isCorrect) {
      return (
        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          <Check className="mr-1 h-3 w-3" /> إجابة صحيحة
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        <X className="mr-1 h-3 w-3" /> إجابة خاطئة
      </span>
    );
  };
  
  // For essay questions that are marked wrong, show model answers for comparison
  const showModelAnswers = question.type === "essay" && !isCorrect && question.modelAnswers;
  
  // For MCQ and TF questions, show what the correct answer was
  const showCorrectAnswer = (question.type === "mcq" || question.type === "tf") && !isCorrect;
  
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          {question.type === "mcq" && (
            <span className="inline-flex items-center justify-center rounded-md bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 ring-1 ring-inset ring-primary-700/10 mb-2">
              اختيار متعدد
            </span>
          )}
          {question.type === "tf" && (
            <span className="inline-flex items-center justify-center rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-2">
              صح/خطأ
            </span>
          )}
          {question.type === "essay" && (
            <span className="inline-flex items-center justify-center rounded-md bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 mb-2">
              سؤال مقالي
            </span>
          )}
          <h4 className="text-md font-medium text-gray-900">{question.text}</h4>
        </div>
        {getStatusBadge()}
      </div>
      
      <div className="mt-2 space-y-4">
        {/* Your Answer */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">إجابتك:</h5>
          {question.type === "mcq" && answer.choiceIndex !== undefined && question.choices && (
            <div className="flex items-center">
              <div className={`h-4 w-4 rounded-full ${
                isCorrect ? "bg-green-100 border-2 border-green-500" : "bg-red-100 border-2 border-red-500"
              }`}></div>
              <span className={`mr-3 block text-sm ${
                isCorrect ? "text-green-600" : "text-red-600"
              }`}>
                {question.choices[answer.choiceIndex]}
              </span>
            </div>
          )}
          
          {question.type === "tf" && answer.booleanAnswer !== undefined && (
            <div className="flex items-center">
              <div className={`h-4 w-4 rounded-full ${
                isCorrect ? "bg-green-100 border-2 border-green-500" : "bg-red-100 border-2 border-red-500"
              }`}></div>
              <span className={`mr-3 block text-sm ${
                isCorrect ? "text-green-600" : "text-red-600"
              }`}>
                {answer.booleanAnswer ? "صح" : "خطأ"}
              </span>
            </div>
          )}
          
          {question.type === "essay" && answer.essayAnswer && (
            <p className="text-sm bg-gray-50 p-3 rounded">
              {answer.essayAnswer}
            </p>
          )}
        </div>
        
        {/* Show Correct Answer */}
        {showCorrectAnswer && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">الإجابة الصحيحة:</h5>
            {question.type === "mcq" && question.correctChoice !== undefined && question.choices && (
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-green-100 border-2 border-green-500"></div>
                <span className="mr-3 block text-sm text-green-600">
                  {question.choices[question.correctChoice]}
                </span>
              </div>
            )}
            
            {question.type === "tf" && question.correctAnswer !== undefined && (
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-green-100 border-2 border-green-500"></div>
                <span className="mr-3 block text-sm text-green-600">
                  {question.correctAnswer ? "صح" : "خطأ"}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Show Model Answers for Essay */}
        {showModelAnswers && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">الإجابة النموذجية:</h5>
            {question.modelAnswers?.map((modelAnswer, index) => (
              <p key={index} className="text-sm bg-gray-50 p-3 rounded mt-2">
                {modelAnswer}
              </p>
            ))}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3">
          <div>
            <span className="text-sm font-medium text-gray-700">الدرجة: </span>
            <span className={`text-sm ${isCorrect ? "text-green-600" : "text-red-600"}`}>
              {answer.points ?? 0} / {question.points}
            </span>
          </div>
          
          {/* Only show request review button for essay questions that are marked wrong and not already under review */}
          {question.type === "essay" && !isCorrect && !reviewRequested && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRequestReview(question.id)}
              className="text-yellow-700 bg-yellow-100 hover:bg-yellow-200 border-yellow-200"
            >
              <RefreshCw className="mr-1 h-3 w-3" /> طلب مراجعة
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
