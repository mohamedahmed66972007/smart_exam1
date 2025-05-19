import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CreateTest from "./CreateTest";
import ManageTests from "./ManageTests";
import TakeTest from "./TakeTest";

export default function Home() {
  const [activeTab, setActiveTab] = useState("create");
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full h-auto border-b border-gray-200 rounded-none bg-transparent">
              <TabsTrigger
                value="create"
                className="flex-1 py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 bg-transparent rounded-none"
              >
                إنشاء اختبار جديد
              </TabsTrigger>
              <TabsTrigger
                value="manage"
                className="flex-1 py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 bg-transparent rounded-none"
              >
                إدارة الاختبارات
              </TabsTrigger>
              <TabsTrigger
                value="take"
                className="flex-1 py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 bg-transparent rounded-none"
              >
                إجراء اختبار
              </TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="mt-0">
              <CreateTest />
            </TabsContent>
            <TabsContent value="manage" className="mt-0">
              <ManageTests />
            </TabsContent>
            <TabsContent value="take" className="mt-0">
              <TakeTest />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
