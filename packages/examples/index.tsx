import * as React from "react";
import { createRoot } from "react-dom/client";

import { FocusRing, FocusRingManager, FocusRingScope } from "react-focus-rings/src";
import "react-focus-rings/src/styles.css";

function Button() {
  return (
    <FocusRing offset={-2}>
      <button onClick={() => FocusRingManager.setRingsEnabled(true)}>Click Me</button>
    </FocusRing>
  );
}

function Anchor({ children }: { children: React.ReactNode }) {
  return (
    <FocusRing>
      <a tabIndex={0} href="#">
        {children}
      </a>
    </FocusRing>
  );
}

function Scrollable({
  children,
  containRing,
  padding = 8,
}: {
  children: React.ReactNode;
  containRing?: boolean;
  padding?: number;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // Render the scope _within_ the scrolling container so that it will render
  // in the same layer and perfectly follow content as it scrolls.
  // Note that the container still needs a `position: relative`.
  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: 100,
        overflow: "scroll",
        backgroundColor: "#eee",
        padding,
      }}
    >
      <FocusRingScope containerRef={containerRef} containRing={containRing}>
        {children}
      </FocusRingScope>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <FocusRing>
      <div tabIndex={0} style={{ padding: 8, backgroundColor: "#ddd", marginBottom: 2 }}>
        {children}
      </div>
    </FocusRing>
  );
}

function EdgeToEdgeRows() {
  return (
    <>
      <Row>First row</Row>
      <Row>Second row</Row>
      <Row>Third row</Row>
      <Row>Fourth row</Row>
      <Row>Last row</Row>
    </>
  );
}

function App() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  return (
    <FocusRingScope containerRef={containerRef}>
      <div className="app-container" ref={containerRef}>
        <div className="content">
          <p>Here's a paragraph with some text.</p>
          <Button />
          <Button />
          <Button />
          <p>
            Here's another paragraph with more text. This one has an{" "}
            <Anchor>anchor tag inside it</Anchor> that you can also focus.
          </p>

          <p>
            This is an example of a scrolling container that uses a nested{" "}
            <code>FocusRingScope</code> to ensure that rings are always rendered in the right
            position.
          </p>
          <Scrollable>
            <Button />
            <p>
              Some padding text that hopefully wraps multiple lines to add vertical space so that
              the buttons are forced to scroll the container when they receive focus.
            </p>
            <Button />
            <p>More padding text</p>
            <Button />
          </Scrollable>

          <p>
            Scroll containers can cut off rings on edge-to-edge rows. With <code>containRing</code>,
            ring edges that extend past the scrollable area move inside the row.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p>Default</p>
              <Scrollable padding={0}>
                <EdgeToEdgeRows />
              </Scrollable>
            </div>
            <div style={{ flex: 1 }}>
              <p>
                <code>containRing</code>
              </p>
              <Scrollable padding={0} containRing>
                <EdgeToEdgeRows />
              </Scrollable>
            </div>
          </div>
        </div>
      </div>
    </FocusRingScope>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
