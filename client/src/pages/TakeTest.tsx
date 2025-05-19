import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Play } from "lucide-react";

const formSchema = z.object({
  shareCode: z.string().min(1, { message: "رابط الاختبار مطلوب" }),
  studentName: z.string().min(1, { message: "اسمك الكامل مطلوب" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function TakeTest() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shareCode: "",
      studentName: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      // Check if the test exists with the given shareCode
      const response = await fetch(`/api/tests/share/${data.shareCode}`);
      
      if (!response.ok) {
        toast({
          title: "خطأ",
          description: "رابط الاختبار غير صالح أو الاختبار غير موجود",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Create a taker entry
      const takerResponse = await fetch("/api/takers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.studentName,
        }),
      });
      
      if (!takerResponse.ok) {
        throw new Error("Failed to create taker");
      }
      
      // Store taker id in session storage
      const taker = await takerResponse.json();
      sessionStorage.setItem("takerId", taker.id.toString());
      sessionStorage.setItem("takerName", data.studentName);
      
      // Redirect to test session
      setLocation(`/test-session/${data.shareCode}`);
    } catch (error) {
      console.error("Error starting test:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء بدء الاختبار. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Extract shareCode from URL if present
  const extractShareCodeFromURL = (url: string): string | null => {
    const match = url.match(/\/test-session\/([^\/]+)/);
    return match ? match[1] : null;
  };
  
  // Auto-fill shareCode if present in URL
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const clipboardText = e.clipboardData.getData("text");
    const shareCode = extractShareCodeFromURL(clipboardText);
    if (shareCode) {
      e.preventDefault();
      form.setValue("shareCode", shareCode);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">إجراء اختبار</h2>
          
          <div className="text-center p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md mx-auto">
                <div className="mb-6">
                  <FormField
                    control={form.control}
                    name="shareCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رابط أو رمز الاختبار</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="أدخل رابط الاختبار أو رمز المشاركة" 
                            {...field} 
                            onPaste={handlePaste}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mb-6">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسمك الكامل</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="أدخل اسمك الكامل هنا" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "جاري التحميل..."
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" /> بدء الاختبار
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
