import { Errored, Loading } from 'solid-js';
import { createRouter } from '@solidjs/router';
import { routes } from './routes';
import Header from './components/Header';
import { AppContextProvider } from './AppContext';
import { startRelativeClock } from './utils/relativeTime';
import { preventSmoothScrollOnTabbing } from './utils';

const Router = createRouter({ routes });

export const App = () => {
  preventSmoothScrollOnTabbing();
  startRelativeClock();

  return (
    <main class="min-h-screen">
      <Router>
        {(props) => (
          <Errored
            fallback={(error, retry) => {
              console.error(error());
              return (
                <div role="alert" class="container p-10 text-center">
                  <p>Unable to load this page. Please try again.</p>
                  <button class="button mt-4" onClick={retry}>
                    Retry
                  </button>
                </div>
              );
            }}
          >
            <AppContextProvider>
              <Header />
              {/* two div wrappers to make page animation work and performant */}
              <div id="main-content">
                <div>
                  <Loading
                    on={props.location.pathname}
                    fallback={<p class="container p-10">Loading page...</p>}
                  >
                    {props.children}
                  </Loading>
                </div>
              </div>
            </AppContextProvider>
          </Errored>
        )}
      </Router>
    </main>
  );
};
