import { useEffect, useState, useCallback } from 'react';
import { useIntl } from 'react-intl'; // Hook for internationalization
import { useDispatch } from 'react-redux'; // Standard hook for dispatching Redux actions
import { useHistory } from 'react-router-dom'; // Hook for navigation
import { defineMessages } from 'react-intl';

// Assuming SVGR setup for SVG as React components (e.g., Vite or CRA with SVGR)
import SavedJobsIcon from '@/material-icons/400-24px/save_job_fill.svg?react';
import { Column } from 'mastodon/components/column';
import { ColumnHeader } from 'mastodon/components/column_header';
import { fetchSavedJobs, unsaveJob } from 'mastodon/actions/jobs';
import JobCard from 'mastodon/components/job_card';
import { JOB_CATEGORIES, JOB_TYPES } from '../create_job/constants'; // Ensure this path is correct

// Define messages for react-intl
const messages = defineMessages({
    heading: { id: "navigation_bar.saved_jobs", defaultMessage: "Saved Jobs" },
    empty: { id: "job.empty_save_jobs", defaultMessage: "You haven't saved any jobs yet!" },
    loading: { id: "job.loading_saved_jobs", defaultMessage: "Loading saved jobs..."} // Added loading message
});

const SavedJobs = () => {
    const intl = useIntl();
    const dispatch = useDispatch(); // Using standard useDispatch
    const history = useHistory();

    const [jobsData, setJobsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Added loading state
    // reload state is used to trigger a refetch when a job is unsaved
    const [reloadTrigger, setReloadTrigger] = useState(0);

    // useCallback for fetchJobsData to ensure stable reference if passed as prop or used in other effects
    const fetchJobsData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Assuming fetchSavedJobs action returns the array of jobs directly
            // or updates the store and this component relies on that update.
            // If it only returns data, this local state approach is fine.
            const response = await dispatch(fetchSavedJobs());
            if (response) { // Check if response is not undefined/null
                setJobsData(response); // Assuming response is the array of jobs
            } else {
                setJobsData([]); // Set to empty array if response is not valid
            }
        } catch (error) {
            console.error('Error fetching saved jobs:', error);
            setJobsData([]); // Clear data on error
            // Optionally, dispatch an error alert to the user
            // dispatch(showAlertForError({ error: 'Failed to load saved jobs.' }));
        } finally {
            setIsLoading(false);
        }
    }, [dispatch]); // dispatch is a stable reference

    useEffect(() => {
        fetchJobsData();
    }, [fetchJobsData, reloadTrigger]); // Refetch when reloadTrigger changes

    const handleUnsaveJob = useCallback(async (jobId, e) => {
        e.stopPropagation(); // Prevent event bubbling, e.g., if JobCard itself is clickable

        try {
            // Assuming unsaveJob action handles API call and potential store updates
            const response = await dispatch(unsaveJob(jobId));
            if (response) { // Or check a specific success flag in response
                // Trigger a refetch of saved jobs by changing reloadTrigger
                setReloadTrigger(prev => prev + 1);
                // Optionally, show a success alert
                // dispatch(showAlert({ message: 'Job unsaved successfully!' }));
            }
        } catch (error) {
            console.error('Error unsaving job:', error);
            // Optionally, dispatch an error alert
            // dispatch(showAlertForError({ error: 'Failed to unsave job.' }));
        }
    }, [dispatch]);

    // Helper function to get human-readable job type
    // useCallback is used here as these functions might be passed to JobCard or used in memoized calculations.
    // If JOB_TYPES/JOB_CATEGORIES are constant and not props, useCallback might be overkill but doesn't harm.
    const getHumanJobType = useCallback((jobType) => {
        const jobTypeDefinition = JOB_TYPES.value.findIndex(type => type === jobType);
        return jobTypeDefinition !== -1 ? JOB_TYPES.human_value[jobTypeDefinition] : jobType;
    }, []); // Empty dependency array if JOB_TYPES is a global constant

    // Helper function to get human-readable job category
    const getHumanJobCategory = useCallback((jobCategoryValue) => {
        for (const category of JOB_CATEGORIES) {
            const categoryDefinition = category.value.findIndex(cat => cat === jobCategoryValue);
            if (categoryDefinition !== -1) {
                return category.human_value[categoryDefinition];
            }
        }
        return jobCategoryValue;
    }, []); // Empty dependency array if JOB_CATEGORIES is a global constant

    return (
        <Column label={intl.formatMessage(messages.heading)}>
            <ColumnHeader
                title={intl.formatMessage(messages.heading)}
                icon='saved' // This likely refers to a string key for a predefined icon in ColumnHeader
                iconComponent={SavedJobsIcon} // Pass the actual SVG component
            />
            <div className='saved-jobs-container' style={{ padding: '10px' }}> {/* Added some padding */}
                {isLoading ? (
                    <p className='loading-message' style={{ textAlign: 'center', padding: '20px' }}>
                        {intl.formatMessage(messages.loading)}
                    </p>
                ) : jobsData.length === 0 ? (
                    <p className='empty-message' style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        {intl.formatMessage(messages.empty)}
                    </p>
                ) : (
                    jobsData.map(job => (
                        <JobCard
                            key={job.id}
                            jobData={{
                                id: job.id,
                                title: job.title,
                                organization_name: job.organization?.name, // Optional chaining
                                organization_logo: job.organization?.avatar, // Optional chaining
                                location: job.location,
                                salary_range: job.salary_range,
                                job_type: getHumanJobType(job.job_type),
                                job_category: getHumanJobCategory(job.job_category),
                                status: job.status,
                            }}
                            isStudent={true} // Assuming this is always true for this view
                            isSaved={true}   // All jobs in this list are saved
                            handleUnsaveJob={handleUnsaveJob}
                            // Pass intl and history if JobCard expects them as props
                            // If JobCard uses hooks, these can be removed.
                            intl={intl}
                            history={history}
                        />
                    ))
                )}
            </div>
        </Column>
    );
};

// Removed HOCs: connect, injectIntl, withRouter
export default SavedJobs;