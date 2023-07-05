import { useRouter } from "next/router";
import { Button } from "../components/button";
import { ContentBox } from "../components/contentBox";
import { FooterButtons } from "../components/footerButtons";
import abi from "../constants/abi.json";
import { BLUE_TEAM_NUMBER, RED_TEAM_NUMBER } from "../constants/utils";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import { useCallback, useEffect } from "react";

const contractConfig = {
    address: process.env.NEXT_PUBLIC_CELLULAR_ENERGY_ADDRESS,
    abi,
    functionName: 'joinTeam',
}

export default function Page() {
    const router = useRouter();
    const { address } = useAccount();
    const { config: blueConfig } = usePrepareContractWrite({
        ...contractConfig, args: [BLUE_TEAM_NUMBER]
    })
    const { config: redConfig } = usePrepareContractWrite({
        ...contractConfig, args: [RED_TEAM_NUMBER]
    })
    const { isLoading: isLoadingBlue, write: blueWrite } = useContractWrite({
        ...blueConfig,
        onSettled() {
            router.push('/game')
        }
    });
    const { isLoading: isLoadingRed, write: redWrite } = useContractWrite({
        ...redConfig,
        onSettled() {
            router.push('/game')
        }
    });

    useEffect(() => {
        if (!address) {
            router.push('/')
        }
    })

    const handleButtonClick = useCallback((team: number) => () => {
        if (team === BLUE_TEAM_NUMBER) {
            blueWrite();
        } else {
            redWrite();
        }
    }, [blueWrite, redWrite])

    return (
        <div className='center'>
            <ContentBox >
                <h1>JOIN A TEAM</h1><br />
                <p>You haven't joined a team for this season yet. In order to play, you must join a team.</p>
                <p>
                    Please join <span className="red"><b>Team Red</b></span> or <span className="blue"><b>Team Blue</b></span>.
                </p>
            </ContentBox>
            <FooterButtons>
                <Button theme="red" onClick={handleButtonClick(RED_TEAM_NUMBER)}>{isLoadingRed ? 'Check Wallet' : 'Join Team RED'}</Button>
                <Button theme="blue" onClick={handleButtonClick(BLUE_TEAM_NUMBER)}>{isLoadingBlue ? 'Check Wallet' : 'Join Team BLUE'}</Button>
            </FooterButtons>
        </div>
    )
}
