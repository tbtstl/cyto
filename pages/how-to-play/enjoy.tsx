import { useRouter } from "next/router";
import { Button } from "../../components/button";
import { ContentBox } from "../../components/contentBox";
import { FooterButtons } from "../../components/footerButtons";

export default function Page() {
    const router = useRouter();

    return (
        <div className='center'>
            <ContentBox >
                <h1>CELLULAR ENERGY</h1><br />
                <p>That's it. The easiest way to learn is by playing the game.</p>
                <p>Enjoy.</p>
            </ContentBox>
            <FooterButtons>
                <Button onClick={() => { router.push('/how-to-play/rewards') }}>Go Back</Button>
                <Button onClick={() => { router.push('/') }}>
                    Start Playing
                </Button>
            </FooterButtons>
        </div>
    )
}
