import { useState } from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';
import { LOGIN, REGISTER, ME } from '../graphql/operations';

export function useAuth() {
  const client = useApolloClient();
  const [authError, setAuthError] = useState('');

  const { data: meData, loading: meLoading } = useQuery(ME, {
    skip: !localStorage.getItem('cyberheist_token'),
    onError: () => logout()
  });

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN);
  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER);

  const login = async (email, password) => {
    setAuthError('');
    try {
      const { data } = await loginMutation({ variables: { email, password } });
      localStorage.setItem('cyberheist_token', data.login.token);
      await client.resetStore();
      return data.login.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (username, email, password) => {
    setAuthError('');
    try {
      const { data } = await registerMutation({ variables: { username, email, password } });
      localStorage.setItem('cyberheist_token', data.register.token);
      await client.resetStore();
      return data.register.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('cyberheist_token');
    client.clearStore();
    window.location.href = '/login';
  };

  return {
    user: meData?.me || null,
    loading: meLoading || loginLoading || registerLoading,
    authError,
    login,
    register,
    logout
  };
}
