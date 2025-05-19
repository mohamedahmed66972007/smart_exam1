import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RotateCw } from "lucide-react";
import { Question, Answer } from "@shared/schema";

interface ReviewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: number;
  question: Question | null;
  answer: Answer | null;
}

export function ReviewRequestModal({
  isOpen,
  onClose,
  submissionId,
  question,
  answer,
}: ReviewRequestModalProps) {
  const { toast } = useToast();
  const [reviewComment, setReviewComment] = useState("");

  // Submit review request mutation
  const reviewRequestMutation = useMutation({
    mutationFn: async (data: { 
      submissionId: number; 
      questionId: string; 
      requestMessage: string; 
      status: string 
    }) => {
      const res = await apiRequest("POST", "/api/review-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/submissions/${submissionId}`] });
      toast({
        title: "تم إرسال طلب المراجعة",
        description: "سيتم مراجعة إجابتك في أقرب وقت",
      });
      onClose();
      setReviewComment("");
    },
    onError: (error) => {
      toast({
        title: "خطأ في إرسال طلب المراجعة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitReviewRequest = () => {
    if (!question || !submissionId) return;

    reviewRequestMutation.mutate({
      submissionId,
      questionId: question.id,
      requestMessage: reviewComment,
      status: "pending",
    });
  };

  // Format the student's answer for display
  const formatStudentAnswer = () => {
    if (!answer || !question) return "";

    switch (question.type) {
      case "essay":
        return answer.essayAnswer || "";
      case "mcq":
        if (answer.choiceIndex !== undefined && question.choices) {
          return question.choices[answer.choiceIndex];
        }
        return "";
      case "tf":
        return answer.booleanAnswer !== undefined 
          ? answer.booleanAnswer ? "صح" : "خطأ" 
          : "";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>طلب مراجعة السؤال</DialogTitle>
          <DialogDescription>
            يرجى توضيح سبب طلب المراجعة لهذا السؤال
          </DialogDescription>
        </DialogHeader>

        {question && (
          <div className="py-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700">السؤال:</h4>
              <p className="mt-1 text-gray-900">{question.text}</p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700">إجابتك:</h4>
              <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">
                {formatStudentAnswer()}
              </p>
            </div>

            {question.type === "essay" && question.modelAnswers && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700">الإجابات النموذجية:</h4>
                {question.modelAnswers.map((modelAnswer, index) => (
                  <p key={index} className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">
                    {modelAnswer}
                  </p>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700">سبب طلب المراجعة:</h4>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="اشرح سبب اعتقادك أن إجابتك صحيحة وتستحق درجات أعلى..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
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
                <RotateCw className="ml-2 h-4 w-4" /> إرسال طلب المراجعة
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReviewRequestModal;
