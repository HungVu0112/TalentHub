import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useParams, useHistory } from 'react-router-dom'; 
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types'; 

import Column from 'mastodon/features/ui/components/column';
import { ColumnBackButton } from 'mastodon/components/column_back_button';
import ScrollableList from 'mastodon/components/scrollable_list';
import { OrganizationHeader } from './components/organization_header';
import JobCard from 'mastodon/components/job_card';
import { fetchJobsByOrganization, fetchSavedJobs, saveJob, unsaveJob, updateJob } from 'mastodon/actions/jobs';
import { showAlert, showAlertForError } from 'mastodon/actions/alerts';
import { JOB_TYPES, JOB_CATEGORIES } from '../create_job/constants';
import { IdentityContext } from 'mastodon/identity_context'; 

const messages = defineMessages({
    job_update_success: { id: 'job.success_update', defaultMessage: 'Job updated successfully!' },
    job_update_error: { id: 'job.error_update', defaultMessage: 'Error updating job!' },
    empty_jobs: { id: 'organization.empty_jobs', defaultMessage: 'There aren’t any jobs yet!' },
    error_fetching_jobs: { id: 'organization.error_fetching_jobs', defaultMessage: 'Error fetching jobs.' },
    error_fetching_saved_jobs: { id: 'organization.error_fetching_saved_jobs', defaultMessage: 'Error fetching saved jobs.' },
    error_saving_job: { id: 'organization.error_saving_job', defaultMessage: 'Error saving job.' },
    error_unsaving_job: { id: 'organization.error_unsaving_job', defaultMessage: 'Error unsaving job.' },
});

const OrganizationPage = () => {
    const intl = useIntl();
    const dispatch = useDispatch();
    const history = useHistory();
    const { id: organizationIdFromParams } = useParams(); 
    const identity = useContext(IdentityContext);
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [localSavedJobIds, setLocalSavedJobIds] = useState(new Set());

    const savedJobsFromStore = useSelector(state => {

        const items = state.getIn(['jobs', 'savedJobLists', 'items']);
        return items ? (typeof items.toJS === 'function' ? items.toJS() : items) : [];
    });

    const storeSavedJobIds = useMemo(() => {
        return new Set(savedJobsFromStore.map(job => job.id ? job.id.toString() : job.toString()));
    }, [savedJobsFromStore]);

    const combinedSavedJobIds = useMemo(() => {
        const combined = new Set([...storeSavedJobIds, ...localSavedJobIds]);
        return combined;
    }, [storeSavedJobIds, localSavedJobIds]);


    const loadJobs = useCallback(async (orgId, page = 1) => {
        setIsLoading(true);
        try {

            const response = await dispatch(fetchJobsByOrganization(orgId, page)); 
            setJobs(prevJobs => page === 1 ? response.data : [...prevJobs, ...response.data]); 
            setHasMore(response.data.length === 20); 
            setCurrentPage(page);
        } catch (error) {
            dispatch(showAlertForError({ error: intl.formatMessage(messages.error_fetching_jobs) }));
            console.error('Error fetching jobs:', error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, intl]);
    const loadSavedJobsForStudent = useCallback(async () => {
        try {
            await dispatch(fetchSavedJobs());
        } catch (error) {
            dispatch(showAlertForError({ error: intl.formatMessage(messages.error_fetching_saved_jobs) }));
            console.error('Error fetching saved jobs:', error);
        }
    }, [dispatch, intl]);

    useEffect(() => {
        if (organizationIdFromParams) {
            setJobs([]);
            setCurrentPage(1);
            setHasMore(true);
            loadJobs(organizationIdFromParams, 1);
        }
        if (identity?.user_type === 'student') {
            loadSavedJobsForStudent();
        }
    }, [organizationIdFromParams, identity?.user_type, loadJobs, loadSavedJobsForStudent]);


    const isJobSaved = useCallback((jobId) => {
        return combinedSavedJobIds.has(jobId.toString());
    }, [combinedSavedJobIds]);

    const handleCloseJob = useCallback(async (jobId, e) => {
        e.stopPropagation();
        try {
            await dispatch(updateJob(jobId, { status: "closed" }));
            dispatch(showAlert({ message: intl.formatMessage(messages.job_update_success) }));

            if (organizationIdFromParams) {
                 loadJobs(organizationIdFromParams, 1);
            }
        } catch (error) {
            dispatch(showAlertForError({ error: intl.formatMessage(messages.job_update_error) }));
        }
    }, [dispatch, intl, organizationIdFromParams, loadJobs]);

    const handleSaveJob = useCallback(async (jobId, e) => {
        e.stopPropagation();
        try {
            await dispatch(saveJob(jobId));
            setLocalSavedJobIds(prev => new Set(prev).add(jobId.toString())); 

        } catch (error) {
            dispatch(showAlertForError({ error: intl.formatMessage(messages.error_saving_job) }));
            console.error('Error saving job:', error);
        }
    }, [dispatch, intl]);

    const handleUnsaveJob = useCallback(async (jobId, e) => {
        e.stopPropagation();
        try {
            await dispatch(unsaveJob(jobId));
            setLocalSavedJobIds(prev => {
                const updated = new Set(prev);
                updated.delete(jobId.toString());
                return updated;
            }); 
        } catch (error) {
            dispatch(showAlertForError({ error: intl.formatMessage(messages.error_unsaving_job) }));
            console.error('Error unsaving job:', error);
        }
    }, [dispatch, intl]);

    const handleLoadMore = useCallback(() => {
        if (organizationIdFromParams && !isLoading && hasMore) {
            loadJobs(organizationIdFromParams, currentPage + 1);
        }
    }, [organizationIdFromParams, isLoading, hasMore, currentPage, loadJobs]);

    const getHumanReadableValue = useCallback((value, typeConstant) => {
        const index = typeConstant.value.findIndex(v => v === value);
        return index !== -1 ? typeConstant.human_value[index] : value;
    }, []);
    
    const getHumanJobType = useCallback((jobType) => {
        return getHumanReadableValue(jobType, JOB_TYPES);
    }, [getHumanReadableValue]);

    const getHumanJobCategory = useCallback((jobCategoryValue) => {
        for (const category of JOB_CATEGORIES) {
            const index = category.value.findIndex(cat => cat === jobCategoryValue);
            if (index !== -1) {
                return category.human_value[index];
            }
        }
        return jobCategoryValue;
    }, []);


    if (!identity) { // Hoặc một kiểm tra loading khác cho identity nếu cần
        return <Column><FormattedMessage id="loading" defaultMessage="Loading..." /></Column>;
    }
    
    const { user_type, organization_id: userOrganizationId } = identity;

    return (
        <Column>
            <ColumnBackButton />
            <ScrollableList
                className='organization-container'
                prepend={
                    organizationIdFromParams && (
                        <OrganizationHeader org_id={organizationIdFromParams} />
                    )
                }
                scrollKey={`organization-jobs-${organizationIdFromParams}`} // Thêm ID để key thay đổi khi org thay đổi
                alwaysPrepend
                isLoading={isLoading && currentPage === 1} // Chỉ hiển thị loading chính khi tải trang đầu
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
                emptyMessage={<FormattedMessage {...messages.empty_jobs} />}
                bindToDocument={false} // Giữ lại prop này
            >
                {jobs.map(job => (
                    <JobCard
                        key={job.id}
                        jobData={{
                            id: job.id,
                            title: job.title,
                            organization_name: job.organization?.name, // Thêm optional chaining
                            organization_logo: job.organization?.avatar,
                            location: job.location,
                            salary_range: job.salary_range,
                            job_type: getHumanJobType(job.job_type),
                            job_category: getHumanJobCategory(job.job_category),
                            status: job.status,
                        }}
                        // Điều kiện hiển thị dựa trên user_type và ID tổ chức
                        isStaff={user_type === 'organization' && userOrganizationId?.toString() === organizationIdFromParams}
                        isOrganizationType={user_type === 'organization'}
                        isStudent={user_type === 'student'}
                        isSaved={isJobSaved(job.id)}
                        handleCloseJob={handleCloseJob}
                        handleSaveJob={handleSaveJob}
                        handleUnsaveJob={handleUnsaveJob}
                        intl={intl} 
                        history={history} 
                    />
                ))}
                {/* Hiển thị loading cho các trang sau */}
                {isLoading && currentPage > 1 && <div style={{ textAlign: 'center', padding: '20px' }}><FormattedMessage id="loading_more" defaultMessage="Loading more..." /></div>}
            </ScrollableList>
        </Column>
    );
};

OrganizationPage.propTypes = {
};

export default OrganizationPage;