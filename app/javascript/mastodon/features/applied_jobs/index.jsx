import AppliedJobIcon from '@/material-icons/400-24px/applied_job_fill.svg?react';
import { defineMessages, injectIntl, useIntl } from 'react-intl';
import { Column } from 'mastodon/components/column';
import { ColumnHeader } from 'mastodon/components/column_header';
import { useAppDispatch } from 'mastodon/store';
import { connect } from 'react-redux';
import { useEffect, useState } from 'react';

import { useHistory, withRouter } from 'react-router';



const messages = defineMessages({
    heading: { id: "navigation_bar.applied_jobs", defaultMessage: "Applied Jobs" },
    empty: { id: "job.empty_applied_job", defaultMessage: "You haven't applied any jobs yet!" }
})

const AppliedJobs = () => {
    const intl = useIntl();
    const dispatch = useAppDispatch();
    const history = useHistory();
    const [jobsData, setJobsData] = useState([]);
    const [reload, setReload] = useState(0);
    const [savedJobIds, setSavedJobIds] = useState([]);
    
   
    const fetchSaveJobs = async () => {
    

        try {
            dispatch(saveJob(jobId)).then(res => {
                if (res) {
                    setSavedJobIds(prev => [...prev, jobId.toString()]);
                    setReload(n=>n+1);
                }
            }).catch(error => {
                console.error('Error saving job:', error);
            });
        } catch (error) {
            console.error('Error saving job:', error);
        }
    }

     
    

    const getHumanJobCategory = (jobCategory) => {
        for (const category of JOB_CATEGORIES) {
            const index = category.value.findIndex(cat => cat === jobCategory);
            if (index !== -1) {
                return category.human_value[index];
            }
        }
        return jobCategory;
    };

    return (
        <></>
    )
}

export default connect()(injectIntl(withRouter(AppliedJobs)));