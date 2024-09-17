import { Trans } from '@lingui/macro';
import { Col, Row } from 'antd';
import moment from 'moment';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { BasePageContent, BasePageHeader } from 'src/components/BaseLayout';
import { EncountersTable } from 'src/components/EncountersTable';
import { EncounterData } from 'src/components/EncountersTable/types';
import { StatusBadge } from 'src/components/EncounterStatusBadge';
import { SearchBar } from 'src/components/SearchBar';
import { useSearchBar } from 'src/components/SearchBar/hooks';
import { Title } from 'src/components/Typography';
import { sharedAuthorizedUser } from 'src/sharedState';
import { formatPeriodDateTime } from 'src/utils/date';
import { renderHumanName } from 'src/utils/fhir';
import { matchCurrentUserRole, Role } from 'src/utils/role';

import { useEncounterList } from './hooks';
import { getEncounterListSearchBarColumns } from './searchBarUtils';

export function EncounterList() {
    const user = sharedAuthorizedUser.getSharedState();
    const userRole = user?.role![0]!.name;
    const { columnsFilterValues, onChangeColumnFilter, onResetFilters } = useSearchBar({
        columns: getEncounterListSearchBarColumns(),
    });
    const currentDate = moment();

    useEffect(() => {
        onChangeColumnFilter([currentDate, currentDate], 'date');
    }, []);

    const roleSearchParams = matchCurrentUserRole({
        [Role.Admin]: () => {
            return {};
        },
        [Role.Patient]: () => {
            return {};
        },
        [Role.Practitioner]: (practitioner) => {
            return { participant: practitioner.id };
        },
        [Role.Receptionist]: () => {
            return {};
        },
    });

    const { encounterDataListRD, handleTableChange, pagination } = useEncounterList(
        columnsFilterValues,
        roleSearchParams,
    );

    const columns = [
        {
            title: <Trans>Patient</Trans>,
            dataIndex: 'patient',
            key: 'patient',
            render: (_text: any, resource: EncounterData) => renderHumanName(resource.patient?.name?.[0]),
        },
        {
            title: <Trans>Practitioner</Trans>,
            dataIndex: 'practitioner',
            key: 'practitioner',
            render: (_text: any, resource: EncounterData) => renderHumanName(resource.practitioner?.name?.[0]),
        },
        {
            title: <Trans>Status</Trans>,
            dataIndex: 'status',
            key: 'status',
            render: (_text: any, resource: EncounterData) => <StatusBadge status={resource.status} />,
        },
        {
            title: <Trans>Date</Trans>,
            dataIndex: 'date',
            key: 'date',
            width: 220,
            render: (_text: any, resource: EncounterData) => formatPeriodDateTime(resource.period),
        },
        {
            title: <Trans>Actions</Trans>,
            dataIndex: 'actions',
            key: 'action',
            width: 180,
            render: (_text: any, resource: EncounterData) => (
                <Row wrap={false}>
                    <Col>
                        <Link
                            to={`/patients/${resource.patient?.id}/encounters/${resource.id}`}
                            style={{ marginRight: 10 }}
                        >
                            <Trans>Open</Trans>
                        </Link>
                    </Col>
                    <Col>
                        <Link
                            to={`/encounters/${resource.id}/video`}
                            state={{ encounterData: resource }}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            <Trans>Video call</Trans>
                        </Link>
                    </Col>
                </Row>
            ),
        },
    ];

    return (
        <>
            <BasePageHeader style={{ paddingTop: 40, paddingBottom: 92 }}>
                <Title style={{ marginBottom: 40 }}>
                    <Trans>Encounters</Trans>
                </Title>

                <SearchBar
                    columnsFilterValues={columnsFilterValues}
                    onChangeColumnFilter={onChangeColumnFilter}
                    onResetFilters={onResetFilters}
                    hideFilters={userRole === Role.Practitioner ? ['practitioner'] : []}
                />
            </BasePageHeader>

            <BasePageContent style={{ marginTop: '-55px', paddingTop: 0 }}>
                <EncountersTable
                    columns={columns}
                    remoteData={encounterDataListRD}
                    handleTableChange={handleTableChange}
                    pagination={pagination}
                />
            </BasePageContent>
        </>
    );
}
