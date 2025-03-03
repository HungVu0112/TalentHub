import { defineMessages, injectIntl } from "react-intl";
import LocationIcon from '@/material-icons/400-24px/location.svg?react';
import SalaryIcon from '@/material-icons/400-24px/salary.svg?react';
import JobTypeIcon from '@/material-icons/400-24px/job_type.svg?react';
import CloseJobIcon from '@/material-icons/400-24px/close_job.svg?react';
import SaveJobIcon from '@/material-icons/400-24px/bookmark.svg?react';
import SaveJobActiveIcon from '@/material-icons/400-24px/bookmark-fill.svg?react';

interface JobDataType {
    id: string | number,
    title: string,
    organization_name: string,
    organization_logo: string,
    location: string,
    salary_range: string,
    job_type: string,
    job_category: string,
    status: string,
}

interface JobCardProps {
    intl?: any;
    history?: any;
    jobData: JobDataType;
    isStaff?: boolean; // Made optional for clarity, default handled below
    isOrganizationType?: boolean; // Made optional
    isStudent?: boolean; // Made optional
    isSaved?: boolean;
    handleCloseJob?: (jobId: string | number, e: React.MouseEvent) => void;
    handleSaveJob?: (jobId: string | number, e: React.MouseEvent) => void;
    handleUnsaveJob?: (jobId: string | number, e: React.MouseEvent) => void;
}

const messages = defineMessages({
    close_job: { id: 'job.close_job', defaultMessage: 'Close job' },
    // Add other messages if needed for aria-labels etc.
})

const JobCard: React.FC<JobCardProps> = ({
    intl,
    history,
    jobData,
    isStaff = false,
    isSaved = false,
    isOrganizationType=false,
    isStudent=false,
    handleCloseJob,
    handleSaveJob,
    handleUnsaveJob
}) => {
    const handleNavigate = () => {
        // Ensure history and jobData.id exist before pushing
        if (history && jobData?.id) {
            history.push(`/jobs/${jobData.id}`);
        } else {
            console.error("History object or Job ID is missing in JobCard");
        }
    };

    // Prevent click event from propagating from icons to the card container
    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        // Add data-testid to the outer div, using job ID for uniqueness
        <div className="job-card-container" onClick={handleNavigate} data-testid={`job-card-${jobData.id}`}>
            <div className="job-card-container__company_logo">
                <img src={jobData.organization_logo} alt="" />
            </div>

            <div className="job-card-container__info">
                <h2 title={jobData.title}>{jobData.title}</h2>
                <p title={jobData.organization_name} className="mt-4">{jobData.organization_name}</p>

                <div className="job_category">
                    <p>{jobData.job_category}</p>
                </div>

                <div className="icon_with_text">
                    <div className="item">
                        <LocationIcon fill="var(--on-input-color)" width={16} />
                        <p>{jobData.location}</p>
                    </div>
                    <div className="item">
                        <SalaryIcon fill="var(--on-input-color)" width={16}/>
                        <p>{jobData.salary_range}</p>
                    </div>
                    <div className="item">
                        <JobTypeIcon fill="var(--on-input-color)" width={16}/>
                        <p>{jobData.job_type}</p>
                    </div>
                </div>
            </div>

            <div className="job-card-container__interaction">
                {/* Add data-testid for the Close Job icon (when job is open) */}
                {jobData.status === "open" && isStaff &&
                    <CloseJobIcon
                        data-testid="close-job-icon" // Added test ID
                        title={intl?.formatMessage(messages.close_job)}
                        width={20}
                        onClick={(e) => { stopPropagation(e); handleCloseJob?.(jobData.id, e); }} // Added stopPropagation
                    />
                }
                {/* Add data-testid for the closed job indicator icon */}
                {jobData.status === 'closed' &&
                    <CloseJobIcon
                        data-testid="closed-job-indicator" // Added test ID (can be different icon)
                        width={20}
                        fill="red"
                        // No onClick needed for indicator
                    />
                 }
                {/* Add data-testid for the Unsave (Active) icon */}
                {isSaved && !isStaff && !isOrganizationType && isStudent &&
                    <SaveJobActiveIcon
                        data-testid="unsave-job-icon" // Added test ID
                        width={20}
                        onClick={(e) => { stopPropagation(e); handleUnsaveJob?.(jobData.id, e); }} // Added stopPropagation
                        fill="#6364ff"
                        // Add aria-label or title for accessibility if needed
                        // title={intl?.formatMessage(messages.unsave_job)}
                    />
                }
                {/* Add data-testid for the Save icon */}
                {!isSaved && !isStaff && !isOrganizationType && isStudent &&
                    <SaveJobIcon
                        data-testid="save-job-icon" // Added test ID
                        fill="var(--on-input-color)"
                        width={20}
                        onClick={(e) => { stopPropagation(e); handleSaveJob?.(jobData.id, e); }} // Added stopPropagation
                        // Add aria-label or title for accessibility if needed
                        // title={intl?.formatMessage(messages.save_job)}
                    />
                 }
            </div>

        </div>
    );
};

// Ensure injectIntl and other HOCs are applied correctly if needed
// Example: export default injectIntl(JobCard);
// Or if not using injectIntl directly:
export default JobCard;
