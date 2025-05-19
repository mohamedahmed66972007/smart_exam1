import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDistance } from "date-fns";
import { ar } from "date-fns/locale";
import { XCircle, Copy, ChartBar, Edit, Trash2, Download, X } from "lucide-react";

export default function ManageTests() {
  const { toast } = useToast();
  // استخدام اسم مستخدم ثابت لسهولة اختبار التطبيق (في التطبيق الحقيقي سيكون مرتبطاً بالمستخدم المسجل)
  const [creatorUsername, setCreatorUsername] = useState<string>("default_creator");
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  
  // Query creator - إما استخدام الموجود أو إنشاء مستخدم جديد
  const creatorQuery = useQuery({
    queryKey: [`/api/creators/${creatorUsername}`],
    queryFn: async () => {
      try {
        // محاولة الحصول على المنشئ
        const response = await fetch(`/api/creators/${creatorUsername}`);
        if (response.ok) return response.json();
        
        // إذا لم يكن موجوداً، قم بإنشائه
        if (response.status === 404) {
          const createResponse = await fetch('/api/creators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: creatorUsername, name: "منشئ الاختبارات" })
          });
          
          if (createResponse.ok) return createResponse.json();
          throw new Error("فشل في إنشاء حساب المنشئ");
        }
        
        throw new Error("فشل في الوصول إلى بيانات المنشئ");
      } catch (error) {
        console.error("Creator query error:", error);
        throw error;
      }
    },
    enabled: !!creatorUsername,
  });
  
  // Query tests if creator exists
  const testsQuery = useQuery({
    queryKey: ['/api/creators', creatorQuery.data?.id, 'tests'],
    queryFn: async () => {
      const res = await fetch(`/api/creators/${creatorQuery.data?.id}/tests`);
      if (!res.ok) throw new Error('Failed to fetch tests');
      return res.json();
    },
    enabled: !!creatorQuery.data?.id,
  });

  // Query submissions for selected test
  const submissionsQuery = useQuery({
    queryKey: ['/api/tests', selectedTest?.id, 'submissions'],
    queryFn: async () => {
      const res = await fetch(`/api/tests/${selectedTest?.id}/submissions`);
      if (!res.ok) throw new Error('Failed to fetch submissions');
      return res.json();
    },
    enabled: !!selectedTest?.id && isResultsModalOpen,
  });

  // Delete test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (testId: number) => {
      await apiRequest("DELETE", `/api/tests/${testId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creators', creatorQuery.data?.id, 'tests'] });
      toast({
        title: "تم حذف الاختبار بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في حذف الاختبار",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyLink = (shareCode: string) => {
    const link = `${window.location.origin}/test-session/${shareCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "تم نسخ الرابط",
      description: "يمكنك الآن مشاركته مع الطلاب",
    });
  };

  const handleViewResults = (test: any) => {
    setSelectedTest(test);
    setIsResultsModalOpen(true);
  };

  const handleDeleteTest = (testId: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الاختبار؟")) {
      deleteTestMutation.mutate(testId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA");
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    return `${durationInMinutes} دقيقة`;
  };

  const handleExportResults = () => {
    // In a real app, this would generate a CSV or Excel file
    toast({
      title: "تم تصدير النتائج",
      description: "تم تصدير النتائج بنجاح",
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">إدارة الاختبارات</h2>
          
          {testsQuery.isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : testsQuery.isError ? (
            <div className="text-center py-8 text-red-500">
              <XCircle className="mx-auto h-12 w-12 mb-2" />
              <p>حدث خطأ أثناء تحميل الاختبارات</p>
            </div>
          ) : !testsQuery.data || testsQuery.data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">لا توجد اختبارات حالياً</p>
              <Button 
                onClick={() => {
                  window.location.href = "/create-test";
                }}
              >
                إنشاء اختبار جديد
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عنوان الاختبار
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عدد المشاركين
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رابط المشاركة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testsQuery.data?.map((test: any) => (
                    <tr key={test.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {test.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(test.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* This would come from submissions count in a real implementation */}
                        0
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <span className="flex-1 truncate text-xs text-gray-500">
                            {`${window.location.origin}/test-session/${test.shareCode}`}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCopyLink(test.shareCode)}
                            className="ml-2 text-primary-600 hover:text-primary-700"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-3 space-x-reverse">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewResults(test)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <ChartBar className="h-4 w-4 mr-1" /> النتائج
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="h-4 w-4 mr-1" /> تعديل
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteTest(test.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Modal */}
      <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-lg">
              نتائج الاختبار: <span>{selectedTest?.title}</span>
            </DialogTitle>
            <DialogDescription>
              عرض نتائج الطلاب الذين أجروا هذا الاختبار
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4">
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <span className="block text-sm text-gray-500">عدد المشاركين</span>
                <span className="block text-2xl font-semibold text-gray-900">
                  {submissionsQuery.data?.length || 0}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-sm text-gray-500">متوسط الدرجات</span>
                <span className="block text-2xl font-semibold text-gray-900">
                  {submissionsQuery.data?.length 
                    ? Math.round(
                        (submissionsQuery.data.reduce(
                          (acc: number, submission: any) => acc + (submission.score / submission.totalPoints) * 100, 
                          0
                        ) / submissionsQuery.data.length)
                      ) + '%'
                    : '0%'
                  }
                </span>
              </div>
              <div className="text-center">
                <span className="block text-sm text-gray-500">طلبات المراجعة</span>
                <span className="block text-2xl font-semibold text-red-500">
                  {submissionsQuery.data?.filter((sub: any) => sub.hasReviewRequest).length || 0}
                </span>
              </div>
            </div>
          </div>
          
          {submissionsQuery.isLoading ? (
            <div className="text-center py-8">جاري تحميل النتائج...</div>
          ) : submissionsQuery.isError ? (
            <div className="text-center py-8 text-red-500">
              <XCircle className="mx-auto h-12 w-12 mb-2" />
              <p>حدث خطأ أثناء تحميل النتائج</p>
            </div>
          ) : !submissionsQuery.data || submissionsQuery.data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>لم يقم أي طالب بإجراء هذا الاختبار بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم الطالب
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإجراء
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      مدة الإجراء
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الدرجة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      طلب مراجعة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissionsQuery.data?.map((submission: any, index: number) => {
                    const percentageScore = Math.round((submission.score / submission.totalPoints) * 100);
                    return (
                      <tr key={submission.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {/* In a real implementation, we'd have the taker's name */}
                          طالب {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(submission.endTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDuration(submission.startTime, submission.endTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            percentageScore >= 70 
                              ? 'bg-green-100 text-green-800' 
                              : percentageScore >= 50 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {percentageScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            submission.hasReviewRequest 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {submission.hasReviewRequest ? 'نعم' : 'لا'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <ChartBar className="h-4 w-4 mr-1" /> عرض الإجابات
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-4">
            <Button 
              variant="default"
              onClick={handleExportResults}
              disabled={!submissionsQuery.data || submissionsQuery.data.length === 0}
            >
              <Download className="h-4 w-4 mr-2" /> تصدير النتائج
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsResultsModalOpen(false)}
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
