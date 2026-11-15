import { Component, type ReactNode } from 'react';
import { PanelMessage } from './PanelMessage';

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

const RETRY_MS = 30_000;

/** Keeps one broken panel from blanking the whole display, and retries on its own. */
export class PanelBoundary extends Component<Props, State> {
  state: State = { failed: false };
  private timer?: number;

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`${this.props.name} panel crashed`, error);
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.setState({ failed: false }), RETRY_MS);
  }

  componentWillUnmount() {
    window.clearTimeout(this.timer);
  }

  render() {
    if (this.state.failed) {
      return (
        <PanelMessage
          icon="error"
          title={`${this.props.name} couldn't be shown`}
          description="Trying again in 30 seconds."
        />
      );
    }
    return this.props.children;
  }
}
