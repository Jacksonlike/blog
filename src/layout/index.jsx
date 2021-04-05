import { Fragment, useMemo } from 'react';

import { Top } from '../components/top';
import { Header } from '../components/header';
import { ThemeSwitch } from '../components/theme-switch';
import { Footer } from '../components/footer';
import { rhythm } from '../utils/typography';

import './index.scss';

export const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`;
  const themeSwitch = useMemo(() => <ThemeSwitch />, []);

  return (
    <Fragment>
      <Top title={title} location={location} rootPath={rootPath} />
      <div
        style={{
          marginLeft: `auto`,
          marginRight: `auto`,
          maxWidth: rhythm(32),
          padding: `${rhythm(1)} ${rhythm(3 / 4)}`,
        }}
      >
        <div className="flex-header">
          <div>
            <Header title={title} location={location} rootPath={rootPath} />
          </div>
          {themeSwitch}
        </div>
        {children}
        <Footer />
      </div>
    </Fragment>
  );
};
