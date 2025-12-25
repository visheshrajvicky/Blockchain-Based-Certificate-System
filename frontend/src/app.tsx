import * as React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Web3Provider } from './contexts/Web3Context';

export const App: React.FC = () => {
  return (
    <Web3Provider>
      <RouterProvider router={router} />
    </Web3Provider>
  );
};
