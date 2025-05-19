import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import CreateTest from "./pages/CreateTest";
import ManageTests from "./pages/ManageTests";
import TakeTest from "./pages/TakeTest";
import TestSession from "./pages/TestSession";
import TestResults from "./pages/TestResults";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create-test" component={CreateTest} />
      <Route path="/manage-tests" component={ManageTests} />
      <Route path="/take-test" component={TakeTest} />
      <Route path="/test-session/:shareCode" component={TestSession} />
      <Route path="/test-results/:submissionId" component={TestResults} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Layout>
          <Router />
        </Layout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
