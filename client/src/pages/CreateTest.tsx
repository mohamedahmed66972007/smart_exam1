import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { QuestionForm } from "@/components/QuestionForm";
import { Question, QuestionType } from "@shared/schema";
import { Plus, PlusCircle, ArrowUp, ArrowDown, Trash2, Save, Copy, Share2 } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  title: z.string().min(1, { message: "عنوان الاختبار مطلوب" }),
  description: z.string().optional(),
  duration: z.number().min(1, { message: "يجب أن تكون مدة الاختبار دقيقة واحدة على الأقل" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateTest() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [creatorUsername, setCreatorUsername] = useState<string>("user_" + Math.random().toString(36).substring(2, 8));
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [testShareLink, setTestShareLink] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 60,
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: {
      creatorId: number;
      title: string;
      description?: string;
      duration: number;
      questions: Question[];
      shareCode: string;
    }) => {
      const res = await apiRequest("POST", "/api/tests", data);
      return res.json();
    },
    onSuccess: (data) => {
      const shareLink = `${window.location.origin}/test-session/${data.shareCode}`;
      setTestShareLink(shareLink);
      setShowShareDialog(true);
      
      toast({
        title: "تم إنشاء الاختبار بنجاح",
        description: "يمكنك الآن مشاركة رابط الاختبار مع الطلاب",
      });
      
      form.reset();
      setQuestions([]);
    },
    onError: (error) => {
      toast({
        title: "خطأ في إنشاء الاختبار",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle creator creation
  const creatorMutation = useMutation({
    mutationFn: async (data: { name: string; username: string }) => {
      const res = await apiRequest("POST", "/api/creators", data);
      return res.json();
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Make sure we have at least one question
    if (questions.length === 0) {
      toast({
        title: "لا يمكن إنشاء اختبار بدون أسئلة",
        description: "يرجى إضافة سؤال واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if creator exists or create a new one
      let creator;
      try {
        const response = await fetch(`/api/creators/${creatorUsername}`);
        if (response.ok) {
          creator = await response.json();
        }
      } catch (error) {
        // Creator doesn't exist, create new one
      }

      if (!creator) {
        creator = await creatorMutation.mutateAsync({
          name: "مستخدم",
          username: creatorUsername,
        });
      }

      // Create the test
      await createTestMutation.mutateAsync({
        creatorId: creator.id,
        title: data.title,
        description: data.description,
        duration: data.duration,
        questions,
        shareCode: nanoid(8),
      });
    } catch (error) {
      console.error("Error creating test:", error);
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: nanoid(),
      type,
      text: "",
      points: 1,
      choices: type === "mcq" ? ["", "", "", ""] : undefined,
      correctChoice: type === "mcq" ? 0 : undefined,
      correctAnswer: type === "tf" ? true : undefined,
      modelAnswers: type === "essay" ? [""] : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (updatedQuestion: Question) => {
    setQuestions(
      questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const moveQuestion = (id: string, direction: "up" | "down") => {
    const index = questions.findIndex((q) => q.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[index],
    ];
    setQuestions(newQuestions);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">إنشاء اختبار جديد</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-gray-200">عنوان الاختبار</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل عنوان الاختبار" {...field} className="dark:bg-slate-700 dark:text-white dark:border-slate-600" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف الاختبار</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أدخل وصفاً للاختبار" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مدة الاختبار (بالدقائق)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          placeholder="60" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseInt(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Questions Section */}
              <div className="bg-white rounded-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">الأسئلة</h2>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => addQuestion("mcq")}
                    >
                      <Plus className="mr-2 h-4 w-4" /> اختيار متعدد
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => addQuestion("tf")}
                    >
                      <Plus className="mr-2 h-4 w-4" /> صح/خطأ
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => addQuestion("essay")}
                    >
                      <Plus className="mr-2 h-4 w-4" /> مقالي
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="question-card border border-gray-200 rounded-lg p-4 bg-white transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {question.type === "mcq" && "سؤال اختيار متعدد "}
                          {question.type === "tf" && "سؤال صح/خطأ "}
                          {question.type === "essay" && "سؤال مقالي "}
                          <span className="question-number">{index + 1}</span>
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveQuestion(question.id, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => moveQuestion(question.id, "down")}
                            disabled={index === questions.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(question.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <QuestionForm
                        question={question}
                        onChange={updateQuestion}
                      />
                    </div>
                  ))}

                  {questions.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
                      <PlusCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-500">
                        أضف أسئلة للاختبار باستخدام الأزرار أعلاه
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Save Test Button */}
              <div className="bg-gray-100 p-4 mt-8 rounded-lg border border-gray-300 shadow-sm">
                <div className="flex justify-center">
                  <Button 
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 text-lg"
                    size="lg"
                    disabled={createTestMutation.isPending}
                  >
                    {createTestMutation.isPending ? (
                      "جاري الحفظ..."
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" /> حفظ وإنشاء الاختبار
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Share Test Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تم إنشاء الاختبار بنجاح</DialogTitle>
            <DialogDescription>
              يمكنك مشاركة الرابط التالي مع الطلاب ليتمكنوا من الوصول إلى الاختبار
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 my-4 bg-gray-100 rounded-md flex items-center">
            <input 
              type="text"
              value={testShareLink}
              readOnly
              className="flex-1 bg-transparent border-none text-gray-800 focus:outline-none focus:ring-0"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(testShareLink);
                toast({
                  title: "تم نسخ الرابط",
                  description: "تم نسخ رابط الاختبار إلى الحافظة",
                });
              }}
              className="ml-2"
            >
              <Copy className="h-4 w-4 ml-2" />
              نسخ الرابط
            </Button>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowShareDialog(false)}
              className="bg-primary-600 hover:bg-primary-700"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
