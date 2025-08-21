export default function SimpleTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Test Page</h1>
      <p>This is a basic test page without any dependencies.</p>
      <button onClick={() => alert('Test!')}>Click Me</button>
    </div>
  );
}