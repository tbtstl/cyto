declare module 'snarkjs' {
    const groth16: {
        exportSolidityCallData: (proof: string, public: string) => Promise<string>;
        fullProve: (input: Object, circuit: string, key: string) => Promise<{ proof: string, publicSignals: string }>;
        verify: (key: string, public: string, proof: string) => Promise<boolean>;
    }
}
