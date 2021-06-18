import * as React from "react";
import classNames from "classnames";
import invariant from "invariant";

import FocusRingContext from "./FocusRingContext";
import FocusRingScope from "./FocusRingScope";

import type { FocusRingProps } from "./FocusRingTypes";

export { FocusRingScope };
export type { FocusRingProps };

interface FocusableChildProps extends React.HTMLAttributes<Element> {
  onFocus: (event: React.FocusEvent<Element>) => unknown;
  onBlur: (event: React.FocusEvent<Element>) => unknown;
}

interface FocusRingComponentProps extends FocusRingProps {
  children: React.ReactElement<FocusableChildProps>;
}

// ref: https://github.com/facebook/react/issues/14927
const useLayoutEffect =
  typeof window !== "undefined" && window.document && window.document.createElement
    ? React.useLayoutEffect
    : React.useEffect;

/**
 * Augments the child component to be able to render a focus ring
 */
export default function FocusRing(props: FocusRingComponentProps) {
  const {
    within = false,
    enabled = true,
    focused,
    offset = 0,
    focusTarget,
    ringTarget,
    ringClassName,
    focusClassName,
    focusWithinClassName,
    children,
  } = props;

  if (focusTarget != null) {
    invariant(
      ringTarget != null,
      "FocusRing was given a focusTarget but the required ringTarget was not provided. A ringTarget is required to avoid ambiguity of where the ring will be applied.",
    );
  }
  if (focused != null) {
    invariant(
      ringTarget != null,
      "FocusRing was given a controlled focused prop but no ringTarget to apply the ring to. A ringTarget is required since it cannot be inferred through regular focus events.",
    );
  }

  const focusedRef = React.useRef(false);
  const [isFocusWithin, setFocusWithin] = React.useState(false);
  const ringContext = React.useContext(FocusRingContext);

  const child = React.Children.only(children);
  const { onBlur: childOnBlur, onFocus: childOnFocus, ...childProps } = child.props;

  const ringOptions = React.useMemo(
    () => ({
      className: ringClassName,
      offset,
    }),
    [ringClassName, offset],
  );

  // Force the ring to update itself whenever this component re-renders
  // to stay up-to-date with the active element's properties.
  useLayoutEffect(() => {
    if (!enabled) return;
    ringContext.invalidate();
  });

  // If this ring no longer is enabled, hide it.
  React.useEffect(() => {
    if (!enabled) ringContext.hide();
  }, [enabled, ringContext]);

  // If this ring was active, hide it when this component unmounts.
  React.useEffect(() => {
    return () => {
      if (focusedRef.current) ringContext.hide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringContext]);

  // Apply the focus ring if the controlled `focused` prop becomes true.
  React.useEffect(() => {
    const container = ringTarget?.current;
    if (focused == null || container == null) return;

    focusedRef.current = focused;
    if (focused) {
      ringContext.showElement(container, ringOptions);
    } else if (focused === false) {
      ringContext.hide();
    }
  }, [focused, ringOptions, ringContext, ringTarget]);

  // When using a remote focus ring (both `focusTarget` and `ringTarget` are
  // set), use native DOM event listeners to track when focus happens.
  useLayoutEffect(() => {
    if (focused != null) return;

    const target = focusTarget?.current;
    const container = ringTarget?.current;
    if (target == null || container == null) return;

    function onFocus(event: FocusEvent) {
      if (container == null) return;
      if (event.currentTarget === event.target) {
        focusedRef.current = true;
        ringContext.showElement(container, ringOptions);
        return;
      }

      setFocusWithin(true);
      if (within) ringContext.showElement(container, ringOptions);
    }

    function onBlur() {
      ringContext.hide();
      focusedRef.current = false;
      setFocusWithin(false);
    }

    (target as HTMLElement).addEventListener("focusin", onFocus, true);
    (target as HTMLElement).addEventListener("focusout", onBlur, true);

    return () => {
      (target as HTMLElement).removeEventListener("focusin", onFocus, true);
      (target as HTMLElement).removeEventListener("focusout", onBlur, true);
    };
  }, [within, ringOptions, focused, ringContext, focusTarget, ringTarget]);

  const onBlur = React.useCallback(
    (event: React.FocusEvent<Element>) => {
      ringContext.hide();
      focusedRef.current = false;
      setFocusWithin(false);
      childOnBlur?.(event);
    },
    [childOnBlur, ringContext],
  );

  const onFocus = React.useCallback(
    (event: React.FocusEvent<Element>) => {
      const container = ringTarget?.current;

      if (event.currentTarget === event.target) {
        focusedRef.current = true;
        ringContext.showElement(container ?? event.currentTarget, ringOptions);
      } else {
        setFocusWithin(true);
        if (within) ringContext.showElement(container ?? event.currentTarget, ringOptions);
      }

      childOnFocus?.(event);
    },
    [ringTarget, within, childOnFocus, ringContext, ringOptions],
  );

  if (!enabled || focusTarget != null || focused != null) return child;
  return React.cloneElement(child, {
    ...childProps,
    className: classNames(
      childProps.className,
      focusedRef.current ? focusClassName : undefined,
      isFocusWithin ? focusWithinClassName : undefined,
    ),
    onBlur,
    onFocus,
  });
}
