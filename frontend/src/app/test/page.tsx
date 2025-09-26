export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tailwind CSS Test</h1>
        <p className="text-gray-600 mb-4">
          If you can see this styled properly, Tailwind CSS is working.
        </p>
        <div className="bg-background text-foreground p-4 rounded border">
          <p>Testing custom CSS variables</p>
        </div>
        <div className="ifest-gradient-bg p-4 rounded mt-4">
          <p>Testing iFest gradient background</p>
        </div>
        <div className="flex gap-2 mt-4">
          <span className="status-badge status-draft">Draft</span>
          <span className="status-badge status-accepted">Accepted</span>
          <span className="status-badge status-rejected">Rejected</span>
        </div>
      </div>
    </div>
  );
}