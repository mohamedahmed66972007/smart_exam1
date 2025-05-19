import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Question, Answer } from "@shared/schema";

interface QuestionDisplayProps {
  question: Question;
  answer: Answer;
  onChange: (answer: Partial<Answer>) => void;
  reviewMode?: boolean;
}

export function QuestionDisplay({ question, answer, onChange, reviewMode = false }: QuestionDisplayProps) {
  const handleMCQChange = (value: string) => {
    onChange({ choiceIndex: parseInt(value) });
  };
  
  const handleTFChange = (value: string) => {
    onChange({ booleanAnswer: value === "true" });
  };
  
  const handleEssayChange = (value: string) => {
    onChange({ essayAnswer: value });
  };
  
  const getQuestionTypeBadge = () => {
    switch (question.type) {
      case "mcq":
        return (
          <span className="inline-flex items-center justify-center rounded-md bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 ring-1 ring-inset ring-primary-700/10 mb-2">
            اختيار متعدد
          </span>
        );
      case "tf":
        return (
          <span className="inline-flex items-center justify-center rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-2">
            صح/خطأ
          </span>
        );
      case "essay":
        return (
          <span className="inline-flex items-center justify-center rounded-md bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 mb-2">
            سؤال مقالي
          </span>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        {getQuestionTypeBadge()}
        <span className="block mt-1">{question.text}</span>
      </h3>
      
      {question.type === "mcq" && question.choices && (
        <div className="mt-4 space-y-2">
          <RadioGroup
            value={answer.choiceIndex !== undefined && answer.choiceIndex >= 0 ? answer.choiceIndex.toString() : undefined}
            onValueChange={handleMCQChange}
            disabled={reviewMode}
          >
            {question.choices.map((choice, index) => (
              <div key={index} className="flex items-center">
                <RadioGroupItem value={index.toString()} id={`choice-${question.id}-${index}`} className="w-4 h-4" />
                <Label htmlFor={`choice-${question.id}-${index}`} className="mr-3">{choice}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
      
      {question.type === "tf" && (
        <div className="mt-4 space-y-2">
          <RadioGroup
            value={answer.booleanAnswer !== undefined ? answer.booleanAnswer.toString() : undefined}
            onValueChange={handleTFChange}
            disabled={reviewMode}
          >
            <div className="flex items-center">
              <RadioGroupItem value="true" id={`true-${question.id}`} className="w-4 h-4" />
              <Label htmlFor={`true-${question.id}`} className="mr-3">صح</Label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value="false" id={`false-${question.id}`} className="w-4 h-4" />
              <Label htmlFor={`false-${question.id}`} className="mr-3">خطأ</Label>
            </div>
          </RadioGroup>
        </div>
      )}
      
      {question.type === "essay" && (
        <div className="mt-4">
          <Textarea
            value={answer.essayAnswer || ""}
            onChange={(e) => handleEssayChange(e.target.value)}
            placeholder="اكتب إجابتك هنا..."
            rows={6}
            disabled={reviewMode}
          />
        </div>
      )}
    </div>
  );
}
