import React, { createContext, useContext, useEffect, useState } from 'react';

const TimeContext = createContext(null);

export const TimeProvider = ({ children }) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        // 100ms interval for smooth UI updates (10fps for numbers is enough)
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <TimeContext.Provider value={now}>
            {children}
        </TimeContext.Provider>
    );
};

export const useTime = () => useContext(TimeContext);
