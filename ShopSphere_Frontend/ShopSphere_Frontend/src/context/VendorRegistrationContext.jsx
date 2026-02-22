import React, { createContext, useContext, useState } from "react";

const VendorRegistrationContext = createContext();

export function VendorRegistrationProvider({ children }) {
    const [registrationFiles, setRegistrationFiles] = useState({
        id_proof_file: null,
        pan_card_file: null
    });

    const updateFiles = (files) => {
        setRegistrationFiles(prev => ({ ...prev, ...files }));
    };

    const clearFiles = () => {
        setRegistrationFiles({
            id_proof_file: null,
            pan_card_file: null
        });
    };

    return (
        <VendorRegistrationContext.Provider value={{ registrationFiles, updateFiles, clearFiles }}>
            {children}
        </VendorRegistrationContext.Provider>
    );
}

export function useVendorRegistration() {
    return useContext(VendorRegistrationContext);
}
