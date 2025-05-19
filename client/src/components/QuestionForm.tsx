import { useState } from "react";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Question } from "@shared/schema";
import { Trash2, Plus } from "lucide-react";

interface QuestionFormProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function QuestionForm({ question, onChange }: QuestionFormProps) {
  const handleTextChange = (text: string) => {
    onChange({ ...question, text });
  };

  const handlePointsChange = (points: number) => {
    onChange({ ...question, points });
  };

  const handleChoiceChange = (index: number, value: string) => {
    if (!question.choices) return;
    const newChoices = [...question.choices];
    newChoices[index] = value;
    onChange({ ...question, choices: newChoices });
  };

  const handleCorrectChoiceChange = (index: number) => {
    onChange({ ...question, correctChoice: index });
  };

  const handleAddChoice = () => {
    if (!question.choices) return;
    onChange({ ...question, choices: [...question.choices, ""] });
  };

  const handleRemoveChoice = (index: number) => {
    if (!question.choices || question.choices.length <= 2) return;
    const newChoices = [...question.choices];
    newChoices.splice(index, 1);
    
    // Update correctChoice if needed
    let correctChoice = question.correctChoice;
    if (correctChoice === index) {
      correctChoice = 0;
    } else if (correctChoice !== undefined && correctChoice > index) {
      correctChoice--;
    }
    
    onChange({ ...question, choices: newChoices, correctChoice });
  };

  const handleCorrectAnswerChange = (value: "true" | "false") => {
    onChange({ ...question, correctAnswer: value === "true" });
  };

  const handleModelAnswerChange = (index: number, value: string) => {
    if (!question.modelAnswers) return;
    const newModelAnswers = [...question.modelAnswers];
    newModelAnswers[index] = value;
    onChange({ ...question, modelAnswers: newModelAnswers });
  };

  const handleAddModelAnswer = () => {
    if (!question.modelAnswers) return;
    onChange({ ...question, modelAnswers: [...question.modelAnswers, ""] });
  };

  const handleRemoveModelAnswer = (index: number) => {
    if (!question.modelAnswers || question.modelAnswers.length <= 1) return;
    const newModelAnswers = [...question.modelAnswers];
    newModelAnswers.splice(index, 1);
    onChange({ ...question, modelAnswers: newModelAnswers });
  };

  return (
    <div className="space-y-4">
      <div>
        <FormLabel className="block text-sm font-medium text-gray-700 mb-1">نص السؤال</FormLabel>
        <Input
          value={question.text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full"
          placeholder="اكتب نص السؤال هنا..."
          required
        />
      </div>
      
      {question.type === "mcq" && (
        <div>
          <FormLabel className="block text-sm font-medium text-gray-700 mb-1">الاختيارات</FormLabel>
          <div className="space-y-2">
            <RadioGroup 
              value={question.correctChoice !== undefined ? String(question.correctChoice) : undefined}
              onValueChange={(value) => handleCorrectChoiceChange(parseInt(value))}
            >
              {question.choices?.map((choice, index) => (
                <div key={index} className="flex items-center gap-2">
                  <RadioGroupItem
                    value={String(index)}
                    id={`choice-${question.id}-${index}`}
                  />
                  <Input
                    value={choice}
                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                    className="flex-1"
                    placeholder={`الخيار ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveChoice(index)}
                    disabled={question.choices && question.choices.length <= 2}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </RadioGroup>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddChoice}
            className="mt-2 text-primary-600 hover:text-primary-700"
          >
            <Plus className="mr-1 h-4 w-4" /> إضافة خيار
          </Button>
        </div>
      )}
      
      {question.type === "tf" && (
        <div>
          <FormLabel className="block text-sm font-medium text-gray-700 mb-2">الإجابة الصحيحة</FormLabel>
          <RadioGroup
            value={question.correctAnswer ? "true" : "false"}
            onValueChange={(value) => handleCorrectAnswerChange(value as "true" | "false")}
            className="flex gap-4"
          >
            <div className="flex items-center">
              <RadioGroupItem value="true" id={`true-${question.id}`} />
              <Label htmlFor={`true-${question.id}`} className="mr-2">صح</Label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value="false" id={`false-${question.id}`} />
              <Label htmlFor={`false-${question.id}`} className="mr-2">خطأ</Label>
            </div>
          </RadioGroup>
        </div>
      )}
      
      {question.type === "essay" && (
        <div>
          <FormLabel className="block text-sm font-medium text-gray-700 mb-1">الإجابات النموذجية (يمكن إضافة أكثر من إجابة)</FormLabel>
          <div className="space-y-2">
            {question.modelAnswers?.map((answer, index) => (
              <div key={index} className="flex items-center gap-2">
                <Textarea
                  value={answer}
                  onChange={(e) => handleModelAnswerChange(index, e.target.value)}
                  className="flex-1"
                  placeholder="اكتب الإجابة النموذجية هنا..."
                  rows={2}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveModelAnswer(index)}
                  disabled={question.modelAnswers && question.modelAnswers.length <= 1}
                  className="text-red-500 hover:text-red-700 h-full"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddModelAnswer}
            className="mt-2 text-primary-600 hover:text-primary-700"
          >
            <Plus className="mr-1 h-4 w-4" /> إضافة إجابة نموذجية أخرى
          </Button>
        </div>
      )}
      
      <div>
        <FormLabel className="block text-sm font-medium text-gray-700 mb-1">الدرجة</FormLabel>
        <Input
          type="number"
          min={1}
          value={question.points}
          onChange={(e) => handlePointsChange(parseInt(e.target.value) || 1)}
          className="w-24"
        />
      </div>
    </div>
  );
}
