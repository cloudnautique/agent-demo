import ClaimDetail from '../../components/ClaimDetail';

export default function ClaimPage({ params }: { params: { id: string } }) {
    return <ClaimDetail params={params} />;
}