import React from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

/**
 * ErrorBoundary — Mencegah seluruh app crash saat satu komponen error.
 * Khususnya penting di lapangan tambang di mana data API bisa datang dalam
 * format tidak terduga (null, malformed, dsb).
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Terjadi Kesalahan</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Halaman ini mengalami error. Coba refresh atau tekan tombol di bawah.
            </p>
            {this.state.error && (
              <p className="text-xs font-mono text-red-500 mt-2 max-w-xs truncate">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={this.handleRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Coba Lagi
            </Button>
            <Button onClick={() => window.location.reload()} className="gap-2">
              Refresh Halaman
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
