import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CoachApp from "./pages/CoachApp";
import { HandPipelineProvider } from "./pipeline/HandPipelineProvider";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Wrap only the app route with the pipeline provider */}
      <Route
        path="/app"
        element={
          <HandPipelineProvider>
            <CoachApp />
          </HandPipelineProvider>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}