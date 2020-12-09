import * as React from "react";
import classNames from "classnames";
import { useForceUpdate } from "react-base-hooks";

import FocusRingContext, { FocusRingContextManager } from "./FocusRingContext";
import { getFocusRingBaseClassName } from "./util/focusRingStyles";

type FocusRingScopeProps = {
  containerRef: React.RefObject<Element>;
  children: React.ReactNode;
};

export default function FocusRingScope(props: FocusRingScopeProps) {
  const { containerRef, children } = props;
  const manager = React.useRef(new FocusRingContextManager());

  React.useEffect(() => {
    manager.current.setContainer(containerRef.current);
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
  const update = useForceUpdate();
  React.useEffect(() => {
    ringContext.invalidate = update;
    return () => {
      ringContext.invalidate = () => null;
    };
  }, [ringContext, update]);

  if (!ringContext.visible) return null;

  return (
    <div
      className={classNames("focus-rings-ring", ringContext.className)}
      style={ringContext.getStyle()}
    />
  );
}
