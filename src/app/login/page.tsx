import LoginForm from './LoginForm';

export default function LoginPage(): React.ReactElement {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Вход</h1>
      <LoginForm />
    </main>
  );
}
