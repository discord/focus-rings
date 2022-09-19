import * as React from "react";
import classNames from "classnames";

import FocusRingContext, { FocusRingContextManager } from "./FocusRingContext";
import FocusRingManager from "./FocusRingManager";
import { ThemeOptions } from "./FocusRingTypes";

type FocusRingScopeProps = {
  containerRef: React.RefObject<Element>;
  children: React.ReactNode;
  themeOptions?: ThemeOptions;
};

export default function FocusRingScope(props: FocusRingScopeProps) {
  const { containerRef, children, themeOptions } = props;
  const manager = React.useRef(new FocusRingContextManager());

  React.useEffect(() => {
    manager.current.setContainer(containerRef.current);
    manager.current.setThemeOptions(themeOptions);
    // We do actually want this to run every time `current` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current]);

  return (
    <FocusRingContext.Provider value={manager.current}>
      {children}
      <Ring />
    </FocusRingContext.Provider>
  );
}

function Ring() {
  const ringContext = React.useContext(FocusRingContext);
  const [, forceUpdate] = React.useState<{}>({});
  React.useEffect(() => {
    ringContext.invalidate = () => forceUpdate({});
    return () => {
      ringContext.invalidate = () => null;
    };
  }, [ringContext]);

  if (!FocusRingManager.ringsEnabled || !ringContext.visible) return null;

  return (
    <div
      className={classNames("focus-rings-ring", ringContext.className)}
      style={ringContext.getStyle()}
    />
  );
}
