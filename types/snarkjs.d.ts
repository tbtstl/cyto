declare module 'snarkjs' {
    const groth16: {
        exportSolidityCallData: (proof: string, public: string) => Promise<string>;
    }
}
