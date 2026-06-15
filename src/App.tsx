import React from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';

// Layout & Pages
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { NoteList } from './pages/NoteList';
import { NoteFormPage } from './pages/NoteFormPage'; // ← এই লাইনটি ঠিক আছে
import { AssessmentsPage } from './pages/AssessmentsPage';
import {ThreatAssessmentPage} from './pages/ThreatAssessmentPage';
import {ThreatAssessmentFormPage}   from './pages/ThreatAssessmentFormPage';
import { AssessmentFormPage } from './pages/AssessmentFormPage';
import FcHomeStudyAssessment from './pages/FcHomeStudyAssessment';
import FcVisitNotes from './pages/FcVisitNotes';

const App: React.FC = () => {
  return (
    <HashRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<NoteList />} />
          <Route path="/add-note" element={<NoteFormPage />} />
          <Route path="/edit-note/:id" element={<NoteFormPage />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/new-assessment" element={<AssessmentFormPage />} />
          <Route path="/edit-assessment/:id" element={<AssessmentFormPage />} />
          <Route path="/threat-assessment" element={<ThreatAssessmentPage />} />
          <Route path="/add-threat" element={<ThreatAssessmentFormPage />} />
          <Route path="/add-threat/:id" element={<ThreatAssessmentFormPage />} />
          <Route path="/threat-assessment/:id" element={<ThreatAssessmentFormPage />} />
          <Route path="/home-study-assessment" element={<FcHomeStudyAssessment />} />
          <Route path="/fc-visit-notes" element={<FcVisitNotes />} />
        </Routes>
      </DashboardLayout>
    </HashRouter>
  );
};

export default App;