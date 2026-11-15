import './App.scss';
import { Clock } from './components/Clock';
import { PanelBoundary } from './components/common/PanelBoundary';
import { Departures } from './components/Departures';
import { Restaurant } from './components/Restaurant';
import { Weather } from './components/Weather';
import { useKiosk } from './hooks/useKiosk';

function App() {
  useKiosk();
  return (
    <main className="app">
      <div className="app__board">
        <PanelBoundary name="Departures">
          <Departures />
        </PanelBoundary>
      </div>
      <div className="app__side">
        <Clock />
        <div className="app__weather">
          <PanelBoundary name="Weather">
            <Weather />
          </PanelBoundary>
        </div>
        <div className="app__lunch">
          <PanelBoundary name="Lunch">
            <Restaurant />
          </PanelBoundary>
        </div>
      </div>
    </main>
  );
}

export default App;
