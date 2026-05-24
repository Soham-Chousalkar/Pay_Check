import { useEffect, useRef, useState, useCallback } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import DebugWindow from "./components/DebugWindow";
import AuthPage from "./components/AuthPage";
import AppControls from "./components/AppControls";
import AppHeader from "./components/AppHeader";
import CanvasControls from "./components/CanvasControls";
import WorldContainer from "./components/WorldContainer";
import HistoryControls from "./components/HistoryControls";
import CanvasLibrary from "./components/CanvasLibrary";
import SettingsWindow from "./components/SettingsWindow";
import { useHistory } from "./hooks/useHistory";
import { useCanvas } from "./hooks/useCanvas";
import { usePanelManagement } from "./hooks/usePanelManagement";
import { usePanelEdgeDetection } from "./hooks/usePanelEdgeDetection";
import { useGrouping } from "./hooks/useGrouping";
import { useDataSync } from "./hooks/useDataSync";
import { useDebugLogging } from "./hooks/useDebugLogging";
import { useZoom } from "./hooks/useZoom";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useAppState } from "./hooks/useAppState";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthErrorBoundary from "./components/AuthErrorBoundary";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorBoundaryWrapper from "./components/ErrorBoundaryWrapper";

/**
 * Main App component - PayTracker
 */
function AppContent() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const { loading: dataLoading, error: dataError, loadUserData, saveCanvas, savePreferences } = useDataSync();

  // Custom hooks
  const { debugLogs, logDebug } = useDebugLogging();
  const { scale, stageRef } = useZoom(logDebug);
  const appState = useAppState();

  // Refs
  const worldRef = useRef(null);
  const inputRef = useRef(null);

  // History management
  const { addToHistory, undo, redo, canUndo, canRedo } = useHistory(50);

  // Load user data
  const [loadedUserData, setLoadedUserData] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    if (user) {
      loadUserData().then((userData) => {
        if (!isCancelled && userData && userData.length > 0) {
          setLoadedUserData(userData);
        }
      });
    }
    return () => { isCancelled = true; };
  }, [user]); // Remove loadUserData from dependencies to prevent infinite re-renders

  // Canvas and panel management hooks
  const canvasHook = useCanvas(addToHistory, loadedUserData, saveCanvas);

  // Function to calculate total earnings for grouped panels
  const calculateGroupEarnings = useCallback((panelIds) => {
    let totalEarnings = 0;
    panelIds.forEach(panelId => {
      const panel = canvasHook.panels.find(p => p.id === panelId);
      if (panel && panel.state && typeof panel.state.earnings === 'number') {
        totalEarnings += panel.state.earnings;
      }
    });
    return totalEarnings;
  }, [canvasHook.panels]);

  const panelManagement = usePanelManagement(canvasHook.panels, canvasHook.setPanels, addToHistory);
  const edgeDetection = usePanelEdgeDetection(canvasHook.panels, scale, panelManagement.isDraggingAny, worldRef, panelManagement.findNeighborOnSide);
  const grouping = useGrouping(canvasHook.panels, canvasHook.setPanels, calculateGroupEarnings);

  // Panel state change handler
  const handlePanelStateChange = useCallback((panelId, state) => {
    canvasHook.setPanels(prev => prev.map(p => p.id === panelId ? { ...p, state } : p));
    logDebug('PANEL_STATE_CHANGE', `Panel ${panelId} state updated`);
  }, [canvasHook.setPanels, logDebug]);

  // Panel delete handler
  const handlePanelDelete = useCallback((panelId) => {
    const prevPanels = [...canvasHook.panels];
    addToHistory(
      'DELETE_PANEL',
      { panels: prevPanels },
      { panels: prevPanels.filter(p => p.id !== panelId) },
      (state) => canvasHook.setPanels(state.panels)
    );
    canvasHook.setPanels(prev => prev.filter(p => p.id !== panelId));
    logDebug('DELETE_PANEL', `Panel ${panelId} deleted`);
  }, [canvasHook.panels, canvasHook.setPanels, addToHistory, logDebug]);

  // Keyboard shortcuts
  useKeyboardShortcuts({ undo, redo, logDebug });

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      className="min-h-screen paper-background overflow-hidden relative"
      style={{
        backgroundImage: appState.backgroundImage ? `url(${appState.backgroundImage})` : undefined,
        backgroundSize: appState.backgroundImage ? 'cover' : undefined,
        backgroundPosition: appState.backgroundImage ? 'center' : undefined,
        backgroundRepeat: appState.backgroundImage ? 'no-repeat' : undefined
      }}
    >
      <AppHeader
        user={user}
        showSettings={appState.showSettings}
        setShowSettings={appState.setShowSettings}
        showCanvasLibrary={canvasHook.showCanvasLibrary}
        setShowCanvasLibrary={canvasHook.setShowCanvasLibrary}
        showLoginModal={appState.showLoginModal}
        setShowLoginModal={appState.setShowLoginModal}
        logout={logout}
        logDebug={logDebug}
      />

      <div className="style-toggle-container" style={{
        left: appState.showSettings ? '250px' : '20px',
        top: '80px',
        right: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'left 0.3s ease-in-out',
        zIndex: 1001,
        position: 'fixed'
      }}>
        <button
          className="style-toggle-button"
          onClick={() => canvasHook.setShowCanvasLibrary(!canvasHook.showCanvasLibrary)}
          title="Show Canvas Library"
        >
          <span className="toggle-icon">📚</span>
          <span className="toggle-text">Canvases</span>
        </button>

        <CanvasControls
          canvases={canvasHook.canvases}
          setCanvases={canvasHook.setCanvases}
          activeCanvasId={canvasHook.activeCanvasId}
          setActiveCanvasId={canvasHook.setActiveCanvasId}
          panels={canvasHook.panels}
          setPanels={canvasHook.setPanels}
          addToHistory={addToHistory}
          logDebug={logDebug}
        />
      </div>

      <AppControls
        showDebug={appState.showDebug}
        setShowDebug={appState.setShowDebug}
        useRetroStyle={appState.useRetroStyle}
        setUseRetroStyle={appState.setUseRetroStyle}
        logDebug={logDebug}
      />

      <HistoryControls
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        logDebug={logDebug}
      />

      <ErrorBoundaryWrapper>
        <WorldContainer
          panels={canvasHook.panels}
          groups={grouping.groups}
          groupVisibility={grouping.groupVisibility}
          scale={scale}
          worldRef={worldRef}
          handleDragStart={panelManagement.handleDragStart}
          handleDrag={panelManagement.handleDrag}
          handleDragEnd={panelManagement.handleDragEnd}
          handlePanelStateChange={handlePanelStateChange}
          handlePanelDelete={handlePanelDelete}
          useRetroStyle={appState.useRetroStyle}
          panelOpacity={appState.panelOpacity}
          previewPanel={panelManagement.previewPanel}
          plusState={edgeDetection.plusState}
          plusButtonInteractionRef={edgeDetection.plusButtonInteractionRef}
          handlePlusMouseEnter={panelManagement.handlePlusMouseEnter}
          handlePlusMouseLeave={panelManagement.handlePlusMouseLeave}
          handleAddPanel={panelManagement.handleAddPanel}
          groupingPreview={grouping.groupingPreview}
          setGroupingPreview={grouping.setGroupingPreview}
          detectGroupingOpportunity={grouping.detectGroupingOpportunity}
          createGroup={grouping.createGroup}
          setGroups={grouping.setGroups}
          setGroupVisibility={grouping.setGroupVisibility}
          recalculateGroupContainer={grouping.recalculateGroupContainer}
          updateGroupTitle={grouping.updateGroupTitle}
          logDebug={logDebug}
        />
      </ErrorBoundaryWrapper>

      <ErrorBoundaryWrapper>
        <CanvasLibrary
          showCanvasLibrary={canvasHook.showCanvasLibrary}
          showSettings={appState.showSettings}
          canvases={canvasHook.canvases}
          activeCanvasId={canvasHook.activeCanvasId}
          openCanvas={canvasHook.openCanvas}
          editingCanvasId={canvasHook.editingCanvasId}
          setEditingCanvasId={canvasHook.setEditingCanvasId}
          editingCanvasName={canvasHook.editingCanvasName}
          setEditingCanvasName={canvasHook.setEditingCanvasName}
          inputRef={inputRef}
          setCanvases={canvasHook.setCanvases}
          deleteCanvas={canvasHook.deleteCanvas}
        />
      </ErrorBoundaryWrapper>

      <ErrorBoundaryWrapper>
        <DebugWindow
          isVisible={appState.showDebug}
          onToggle={() => appState.setShowDebug(false)}
          debugLogs={debugLogs}
        />
      </ErrorBoundaryWrapper>

      <ErrorBoundaryWrapper>
        <SettingsWindow
          showSettings={appState.showSettings}
          panelOpacity={appState.panelOpacity}
          setPanelOpacity={appState.setPanelOpacity}
          backgroundImage={appState.backgroundImage}
          setBackgroundImage={appState.setBackgroundImage}
          user={user}
          logout={logout}
          logDebug={logDebug}
        />
      </ErrorBoundaryWrapper>

      <Analytics />
      <SpeedInsights />

      {appState.showLoginModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => appState.setShowLoginModal(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '720px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <AuthPage onLogin={(u) => { login(u); appState.setShowLoginModal(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}

import { TimeProvider } from "./contexts/TimeContext";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthErrorBoundary>
        <AuthProvider>
          <TimeProvider>
            <AppContent />
          </TimeProvider>
        </AuthProvider>
      </AuthErrorBoundary>
    </ErrorBoundary>
  );
}
