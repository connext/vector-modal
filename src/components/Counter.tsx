import { render } from 'hybrids';
import React, { FC, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface CounterProps {
  count: number;
}

const Counter: FC<CounterProps> = props => {
  const [count, setCount] = useState<number>(props.count);

  const typeOfProps = typeof props.count;
  console.log(props.count, typeOfProps);
  useEffect(() => {
    if (props.count !== count) {
      setCount(props.count);
    }
  }, [props.count]);

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
};

// This function creates update callback, which uses react-dom
// to render content in shadowRoot of the custom element.
// For production use it should support ShadyCSS polyfill
// to properly distribute styles in custom element rendered by React
function reactify(fn) {
  return render(
    host => {
      const Component = fn(host);
      return (host, target) => ReactDOM.render(Component, target);
    },
    { shadowRoot: false }
  );
}

export default {
  count: 0,
  render: reactify(({ count }) => <Counter count={count} />),
};
