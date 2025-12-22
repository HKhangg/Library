'use client';

import { PersistGate } from "redux-persist/integration/react";
import { Provider } from "react-redux";
import { store, persistor } from "@/store/store"; // đường dẫn đúng của bạn
import { SWRConfig } from "swr";

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SWRConfig
          value={{
            revalidateOnFocus: false,        
            revalidateOnReconnect: true,     // Refetch khi mạng reconnect
            dedupingInterval: 5000,          // Dedupe requests trong 5s
            refreshInterval: 0,              // Không auto refresh
            errorRetryCount: 3,              // Retry 3 lần nếu lỗi
            shouldRetryOnError: true,
            keepPreviousData: true,          // Giữ data cũ khi fetch mới
          }}
        >
          {children}
        </SWRConfig>
      </PersistGate>
    </Provider>
  );
}