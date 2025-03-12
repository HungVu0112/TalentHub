import Column from 'mastodon/features/ui/components/column';
import { ColumnBackButton } from 'mastodon/components/column_back_button';
import { useAppDispatch } from "mastodon/store";
import { defineMessages, injectIntl, useIntl } from "react-intl";
import { useEffect, useState } from 'react';
import { useIdentity, withIdentity } from 'mastodon/identity_context';
import { connect } from 'react-redux';
import { fetchJob, saveJob, unsaveJob, fetchSavedJobs, updateJob } from 'mastodon/actions/jobs';
import { useHistory, useParams } from 'react-router';
import { withRouter } from 'react-router';
import { JOB_CATEGORIES, JOB_TYPES } from '../create_job/constants';
import LocationIcon from '@/material-icons/400-24px/location.svg?react';
import SalaryIcon from '@/material-icons/400-24px/salary.svg?react';
import JobTypeIcon from '@/material-icons/400-24px/job_type.svg?react';
import Editor from '../create_job/components/editor';
import ApplicationModal from './components/application_modal';
import SaveJobIcon from '@/material-icons/400-24px/bookmark.svg?react';
import SaveJobActiveIcon from '@/material-icons/400-24px/bookmark-fill.svg?react';
import { checkJobApplication, fetchJobApplicationsByJob } from 'mastodon/actions/job_applications';
import ApplicationCard from 'mastodon/components/application_card';

const messages = defineMessages({
    description: { id: 'job.description', defaultMessage: 'Description' },
    requirements: { id: 'job.requirements', defaultMessage: 'Requirements' },
    contact_email: { id: 'job.contact_email', defaultMessage: 'Contact Email' },
    deadline: { id: 'job.deadline', defaultMessage: 'Deadline'},
    status: { id: 'job.status', defaultMessage: 'Status'},
    views_count: { id: 'job.views_count', defaultMessage: 'Views Count' },
    application_count: { id: 'job.application', defaultMessage: 'Application Count'},
    apply: { id: 'job.apply', defaultMessage: 'Easy Apply'},
    status_open: { id: 'job.status_open', defaultMessage: 'Opening'},
    status_closed: { id: 'job.status_close', defaultMessage: 'Closed'},
    close_job: { id: 'job.close_job', defaultMessage: 'Close Job' },
    caution: { id: 'job.caution', defaultMessage: 'Please use edu email to continue' },
    save_job: { id: 'job.save_job', defaultMessage: 'Save Job' },
    unsave_job: { id: 'job.unsave_job', defaultMessage: 'Unsave Job' },
    applied: { id: 'application.applied', defaultMessage: 'Applied' },
    list: { id: 'application.list', defaultMessage: 'Application List'},
    list_empty: { id: 'application.list_empty', defaultMessage: 'There are no applications'}
});

const JobPage = () => {
    const intl = useIntl();
    const dispatch = useAppDispatch();
    const identity = useIdentity();
    const history = useHistory();
    const { user_type, organization_id } = identity;
    const [jobData, setJobData] = useState({});
    const { id } = useParams();
    const [openModal, setOpenModal] = useState(false);
    const [savedJob, setSavedJob] = useState(false);
    const [savedJobIds, setSavedJobIds] = useState([]);
    const [isApplied, setIsApplied] = useState(false);
    const [applyStatus, setApplyStatus] = useState("");
    const [isClosed, setIsClosed] = useState(false);
    const [applicantList, setApplicantList] = useState([]);
    const [reLoad, setReload] = useState(0);

    // Fetch job data and check if it's saved
    useEffect(() => {
        setJobData({});
        dispatch(fetchJob(id, true)).then((res) => {
            if (res) {
              setJobData(res);
              setIsClosed(res.status === "closed");
            }
        }).catch(err => {
          console.error('Error fetching job:', err);
        });

        if (user_type === "student") {
          dispatch(fetchSavedJobs()).then((savedJobs) => {
            if (savedJobs && savedJobs.length > 0) {
              const jobIds = savedJobs.map(job => job.id.toString());
              setSavedJobIds(jobIds);
              setSavedJob(jobIds.includes(id.toString()));
            }
          }).catch(err => {
            console.error('Error fetching saved jobs:', err);
          });
          checkAppilied();
        }
    }, [dispatch, id, user_type]);

    useEffect(() => {
        if (jobData?.title) {
            if (user_type === 'organization' && jobData.organization.id === organization_id?.toString()) {
                getApplications();
            }
        }
    }, [jobData, reLoad]) // Thêm dependency reLoad nếu muốn fetch lại applications khi reload

    const getApplications = async () => {
        try {
            const res = await dispatch(fetchJobApplicationsByJob(id));
            if (res && res.length > 0) {
                setApplicantList(res);
            } else {
                setApplicantList([]); // Đảm bảo reset nếu không có ứng viên
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    }

    const checkAppilied = async () => {
        try { // Thêm try...catch
            const res = await dispatch(checkJobApplication(id));
            if (res) {
                if (res.applied) {
                    setIsApplied(true);
                    setApplyStatus(res.application_status);
                } else {
                    setIsApplied(false); // Reset nếu không applied
                    setApplyStatus("");
                }
            }
        } catch(error) {
             console.error('Error checking application status:', error);
        }
    }

    const getHumanJobType = (jobType) => {
        // Kiểm tra JOB_TYPES và value tồn tại
        if (!JOB_TYPES || !Array.isArray(JOB_TYPES.value)) return jobType;
        const index = JOB_TYPES.value.findIndex(type => type === jobType);
        return index !== -1 && JOB_TYPES.human_value?.[index] ? JOB_TYPES.human_value[index] : jobType;
    };

    const getHumanJobCategory = (jobCategory) => {
         // Kiểm tra JOB_CATEGORIES tồn tại
        if (!Array.isArray(JOB_CATEGORIES)) return jobCategory;
        for (const category of JOB_CATEGORIES) {
             // Kiểm tra category.value tồn tại
            if (!category || !Array.isArray(category.value)) continue;
            const index = category.value.findIndex(cat => cat === jobCategory);
            if (index !== -1 && category.human_value?.[index]) {
                return category.human_value[index];
            }
        }
        return jobCategory;
    };

    const handleOpenModal = () => {
        setOpenModal(true);
    }

    const handleSaveJob = async (e) => {
        e.stopPropagation();
        if (savedJob) { return handleUnsaveJob(e); }
        try {
            const res = await dispatch(saveJob(id));
            if (res) {
                setSavedJobIds(prev => [...prev, id.toString()]);
                setSavedJob(true);
            }
        } catch (error) { console.error('Error saving job:', error); }
    };

    const handleUnsaveJob = async (e) => {
        e.stopPropagation();
        try {
            const res = await dispatch(unsaveJob(id));
            if (res) {
                setSavedJobIds(prev => prev.filter(jobId => jobId !== id.toString()));
                setSavedJob(false);
            }
        } catch (error) { console.error('Error unsaving job:', error); }
    };

    const handleCloseJob = async (e) => {
        e.preventDefault();
        const status = "closed";
        try {
            const res = await dispatch(updateJob(id, { status }));
            if (res) {
                setIsClosed(true);
                setJobData(prevData => ({ ...prevData, status: "closed" }));
            }
        } catch (error) { console.error('Error closing job:', error); }
    };

    if (!jobData?.title) {

        return null;
    }

    const navigate = (orgId) => { 
        if (orgId) {
             history.push(`/organization/${orgId}`);
        }
    }

    const organizationName = jobData.organization?.name;
    const organizationAvatar = jobData.organization?.avatar;
    const organizationIdProp = jobData.organization?.id; 
    const contactEmail = jobData.user?.email;

    return (
        <Column>
            <ColumnBackButton />
            <div className='job-container'>
                <div className='job-container__heading'>
                    {user_type === "student" && (
                        <div className="save-job-button" onClick={handleSaveJob} data-testid="save-unsave-button-container">
                            {savedJob ?
                                <SaveJobActiveIcon data-testid="unsave-job-icon" width={20} fill="#6364ff"/>
                                :
                                <SaveJobIcon data-testid="save-job-icon" width={20} fill="var(--on-input-color)"/>
                            }
                        </div>
                    )}
                    <div className='company-logo'>

                        {organizationAvatar && <img src={organizationAvatar} alt="Logo" />}
                    </div>

                    <div className='review-info'>
                        <h2>{jobData.title}</h2>
                        {organizationName && <p onClick={() => navigate(organizationIdProp)}>{organizationName}</p>}

                        <div className='job_category'>
                            <p>{getHumanJobCategory(jobData.job_category)}</p>
                        </div>

                        <div className='group-3-items'>
                            <div className='item'>
                                <LocationIcon width={20} fill='var(--on-input-color)'/>
                                <p>{jobData.location}</p>
                            </div>
                            <div className='item'>
                                <SalaryIcon width={20} fill='var(--on-input-color)'/>
                                <p>{jobData.salary_range}</p>
                            </div>
                            <div className='item'>
                                <JobTypeIcon width={20} fill='var(--on-input-color)'/>
                                <p>{getHumanJobType(jobData.job_type)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='job-container__detail_info'>
                    <div className='review-count'>
                        <div className='item'>
                            <h3>{intl.formatMessage(messages.status)}: </h3>
                            <p>{jobData.status === "open" ? intl.formatMessage(messages.status_open) : intl.formatMessage(messages.status_closed)}</p>
                        </div>
                        <div className='item'>
                            <h3>{intl.formatMessage(messages.views_count)}: </h3>
                            <p>{jobData.views_count}</p>
                        </div>
                        <div className='item'>
                            <h3>{intl.formatMessage(messages.application_count)}: </h3>
                            <p>{jobData.application_count}</p>
                        </div>
                    </div>

                    <div className='info'>
                        <h3>{intl.formatMessage(messages.description)}</h3>
                        <Editor
                            value={jobData.description}
                            readOnly
                        />
                    </div>
                    <div className='info'>
                        <h3>{intl.formatMessage(messages.requirements)}</h3>
                        <Editor
                            value={jobData.requirements}
                            readOnly
                        />
                    </div>

                    <div className='deadline'>
                        <h3>{intl.formatMessage(messages.deadline)}: </h3>
                        <p>
                            {jobData.deadline ? intl.formatDate(jobData.deadline, {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                            }) : 'N/A'}
                        </p>
                    </div>

                    <div className='contact-email'>
                        <h3>{intl.formatMessage(messages.contact_email)}: </h3>
                        <p>{contactEmail || 'N/A'}</p>
                    </div>

                    {isClosed ?
                        <div className='close-job'>
                            <p>{intl.formatMessage(messages.close_job)}</p>
                        </div>
                        :
                        <>
                            {isApplied ?
                                <div className='applied'>
                                    <div className='box-text'>
                                        <p>{intl.formatMessage(messages.applied)}</p>
                                    </div>
                                    <div className="app-status">
                                        <h3>{intl.formatMessage(messages.status)}:</h3>
                                        <p>{applyStatus}</p>
                                    </div>
                                </div>
                                :
                                <button
                                    data-testid={user_type === "organization" && organizationIdProp === organization_id?.toString() ? "close-job-button" : "apply-job-button"}
                                    disabled={organizationIdProp !== organization_id?.toString() && user_type !== "student"}
                                    title={organizationIdProp !== organization_id?.toString() && user_type !== "student" ? intl.formatMessage(messages.caution) : undefined}
                                    onClick={user_type === "organization" && organizationIdProp === organization_id?.toString() ? handleCloseJob : handleOpenModal}
                                >
                                    {user_type === "student" && intl.formatMessage(messages.apply)}
                                    {user_type === "organization" && organizationIdProp === organization_id?.toString() && intl.formatMessage(messages.close_job)}
                                </button>
                            }
                        </>
                    }

                </div>
                {user_type === "organization" && organizationIdProp === organization_id?.toString() &&
                    <div className='application-list'>
                        <h3>{intl.formatMessage(messages.list)}</h3>
                        <div className='list' data-testid="applicant-list-container">
                            {applicantList.length === 0 ?
                                <p className='empty'>{intl.formatMessage(messages.list_empty)}</p>
                                :
                                applicantList.map(appData => {
                                    return <ApplicationCard key={appData.id} appData={appData} reFetch={setReload}/>
                                })
                            }
                        </div>
                    </div>
                    }
            </div>
            {openModal && <ApplicationModal jobId={id} setOpenModal={setOpenModal}/>}
        </Column>
    )

}

export default connect()(injectIntl(withIdentity(withRouter(JobPage))));
