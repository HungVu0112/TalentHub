import { createPollFromServerJSON } from 'mastodon/models/poll';

import { importAccounts } from '../accounts_typed';

import { normalizeStatus } from './normalizer';
import { importPolls } from './polls';

export const STATUS_IMPORT   = 'STATUS_IMPORT';
export const STATUSES_IMPORT = 'STATUSES_IMPORT';
export const FILTERS_IMPORT  = 'FILTERS_IMPORT';
export const ORGANIZATION_IMPORT = 'ORGANIZATION_IMPORT';
export const ORGANIZATIONS_IMPORT = 'ORGANIZATIONS_IMPORT';
export const JOB_IMPORT = 'JOB_IMPORT';
export const JOBS_IMPORT = 'JOBS_IMPORT';
export const JOB_APPLICATION_IMPORT = 'JOB_APPLICATION_IMPORT';
export const JOB_APPLICATIONS_IMPORT = 'JOB_APPLICATIONS_IMPORT';

function pushUnique(array, object) {
  if (array.every(element => element.id !== object.id)) {
    array.push(object);
  }
}

export function importStatus(status) {
  return { type: STATUS_IMPORT, status };
}

export function importStatuses(statuses) {
  return { type: STATUSES_IMPORT, statuses };
}

export function importFilters(filters) {
  return { type: FILTERS_IMPORT, filters };
}

export function importOrganization(organization) {
  return { type: ORGANIZATION_IMPORT, organization };
}

export function importOrganizations(organizations) {
  return { type: ORGANIZATIONS_IMPORT, organizations };
}

export function importJob(job) {
  return { type: JOB_IMPORT, job };
}

export function importJobs(jobs) {
  return { type: JOBS_IMPORT, jobs };
}

export function importJobApplication(application) {
  return { type: JOB_APPLICATION_IMPORT, application };
}

export function importJobApplications(applications) {
  return { type: JOB_APPLICATIONS_IMPORT, applications };
}

export function importFetchedAccount(account) {
  return importFetchedAccounts([account]);
}

export function importFetchedAccounts(accounts) {
  const normalAccounts = [];

  function processAccount(account) {
    pushUnique(normalAccounts, account);

    if (account.moved) {
      processAccount(account.moved);
    }
  }

  accounts.forEach(processAccount);

  return importAccounts({ accounts: normalAccounts });
}

export function importFetchedStatus(status) {
  return importFetchedStatuses([status]);
}

export function importFetchedStatuses(statuses) {
  return (dispatch, getState) => {
    const accounts = [];
    const normalStatuses = [];
    const polls = [];
    const filters = [];

    function processStatus(status) {
      pushUnique(normalStatuses, normalizeStatus(status, getState().getIn(['statuses', status.id])));
      pushUnique(accounts, status.account);

      if (status.filtered) {
        status.filtered.forEach(result => pushUnique(filters, result.filter));
      }

      if (status.reblog?.id) {
        processStatus(status.reblog);
      }

      if (status.poll?.id) {
        pushUnique(polls, createPollFromServerJSON(status.poll, getState().polls.get(status.poll.id)));
      }

      if (status.card) {
        status.card.authors.forEach(author => author.account && pushUnique(accounts, author.account));
      }
    }

    statuses.forEach(processStatus);

    dispatch(importPolls({ polls }));
    dispatch(importFetchedAccounts(accounts));
    dispatch(importStatuses(normalStatuses));
    dispatch(importFilters(filters));
  };
}

export function importFetchedOrganization(organization) {
  return (dispatch) => {
    // Import organization
    dispatch(importOrganization(organization));

    // Import members as accounts nếu cần
    if (organization.members) {
      dispatch(importFetchedAccounts(organization.members));
    }
  };
}

export function importFetchedOrganizations(organizations) {
  return (dispatch) => {
    // Import multiple organizations
    dispatch(importOrganizations(organizations));

    // Collect and import all members
    const allMembers = organizations.flatMap(org => org.members || []);
    if (allMembers.length > 0) {
      dispatch(importFetchedAccounts(allMembers));
    }
  };
}


