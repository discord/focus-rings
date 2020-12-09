# Focus Rings

A centralized system for displaying and stylizing focus indicators anywhere on a webpage.

## Installation

This package is available through npm as `react-focus-rings` and can be installed with any package
manager.

## Usage

There are two main parts to this library, `FocusRing` and `FocusRingScope`. To start, render a
`FocusRingScope` around the main body of your app, then wrap any focusable elements on the page with
`FocusRing` to have them automatically render a focus ring when they become the active element. If
no `FocusRingScope` is present in the component hierarchy, no focus rings will be rendered.

Also, be sure to render a new `FocusRingScope` inside of any component that has a scroll container,
or is absolutely positioned within the viewport. Otherwise the position calculations for rings will
not align with the visual position of the element on the page, and may not track properly as those
elements move around.

The focus ring exported from this component also relies on some default CSS styles in order to
render properly. To make this work in your project, be sure to import the styles separately somwhere
within your app with `import "focus-rings/styles.css";`.

A complete, minimal example might look like this:

```typescript
import * as React from "react";
import ReactDOM from "react-dom";

import { FocusRing, FocusRingScope } from "react-focus-rings";
import "focus-rings/styles.css";

function App() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  return (
    <div className="app-container" ref={containerRef}>
      <FocusRingScope containerRef={containerRef}>
        <div className="content">
          <p>Here's a paragraph with some text.</p>
          <FocusRing offset={-2}>
            <button onClick={console.log}>Click Me</button>
          </FocusRing>
          <p>Here's another paragraph with more text.</p>
        </div>
      </FocusRingScope>
    </div>
  );
}

ReactDOM.render(<App />, document.body);
```

You can find a more complete example in the `examples/` directory of this repository.

## Motivation

When working on creating a complete keyboard navigation experience for Discord, we ran into a number
of problems with rendering clean and consistent focus rings and were unable to find any suitable
native alternatives. After a lot of trial and error, we landed on this system as a way to meet all
of our needs. You can read more about the process we went through in [this blog post]() (link TBD).
