import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import App from './App';

const httpLink = createHttpLink({ uri: '/graphql' });

// Attach JWT token to every request
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('cyberheist_token');
  return {
    headers: { ...headers, authorization: token ? `Bearer ${token}` : '' }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
