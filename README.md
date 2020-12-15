# Focus Rings

A centralized system for displaying and stylizing focus indicators anywhere on a webpage.


## Motivation

When working on creating a complete keyboard navigation experience for Discord, we ran into a number
of problems with rendering clean and consistent focus rings and were unable to find any suitable
native alternatives. After a lot of trial and error, we landed on this system as a way to meet all
of our needs. You can read more about the process we went through in [this blog post]() (link TBD).

## Installation

This package is published under [`react-focus-rings`](https://www.npmjs.com/package/react-focus-rings) and can be installed with any npm-compatible package
manager.

## Usage

This library is composed of two components: `FocusRing` and `FocusRingScope`.

### `FocusRingScope`


`FocusRingScope` is responsible for providing a frame of reference for calculating the position of any `FocusRing` instances it
contains. The `containerRef` prop takes a [`React.Ref`](https://reactjs.org/docs/refs-and-the-dom.html) that references the DOM
element that should be used for these position calculations. You'll want to include a `FocusRingScope` instance at the top level
of your application. If a component creates a new scroll container, or is absoultely positioned within the viewport, you should
add a new `FocusRingScope`. 


```tsx
function ScopeExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef} id="main">
      <FocusRingScope containerRef={containerRef}>
       {/* ... */}
      </FocusRingScope>
    </div>
  )
}
```

Keep in mind that **the element provided to `containerRef` must be styled with `position: relative`** or else the alignment calculations
will be incorrect. If you find that `FocusRing` isn't being rendered at all or its positioning is wrong, verify that you have a
`FocusRingScope` in the correct places and that the `containerRef` element has the `position: relative` style.

### `FocusRing`

The `FocusRing` is the main show. You can wrap any focusable element with a `FocusRing` and it will add the required `focus`/`blur`
listeners and magically render the focus ring when the element receives focus. We recommend integrating this at the design primitive
level, in custom components like `Button` or `Link`, so you get the focus ring behavior across your application with minimal effort.

```tsx
function Button(props: ButtonProps) {
  return (
    <FocusRing>
      <button {...props} />
    </FocusRing>
  );
}
```

#### Props
`FocusRing` has a few props you can use to get the right behavior and alignment. If using TypeScript the type is exported as `FocusRingProps`

```tsx
import {FocusRingProps} from 'react-focus-rings'
```

* `within` - acts like [`:focus-within`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within) and will render the focus ring if _any_ descendant is focused
* `enabled` - controls whether the `FocusRing` is being rendered
* `focused` - controls the focused state
* `offset` - lets you adjust the alignment of the focus ring, relative to the focused element. Can be a `number` or [`Offset` object](https://github.com/discord/focus-rings/blob/4a629f22486e6c70e726182cfcdff1d60704f508/src/FocusRingTypes.tsx#L1-L6)
* `focusTarget` - lets you choose a different element to act as the focus target for the ring. Must be used with `ringTarget`.
* `ringTarget` - lets you choose a different element to render the ring around. Must be used with `focusTarget`.
* `focusWithinClassName` - lets you apply a CSS class to the focused element when a descendant is focused. Like `:focus-within`.


## Default Styling

The focus ring also relies on some default CSS styles in order to
render properly. To make this work in your project, be sure to import the styles separately somwhere
within your app with `import "focus-rings/src/styles.css";`.

## Example

A complete, minimal example might look like this:

```tsx
import * as React from "react";
import ReactDOM from "react-dom";

import { FocusRing, FocusRingScope } from "react-focus-rings";
import "focus-rings/src/styles.css";

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

You can find a more complete example in the [`examples` directory](https://github.com/discord/focus-rings/tree/main/examples) of this repository. You can find a [hosted version of the example application here.](https://codesandbox.io/s/happy-fermat-8xd7i?file=/src/index.tsx)
