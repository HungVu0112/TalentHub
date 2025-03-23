import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom'; // For accessing URL parameters
import { useDispatch, useSelector } from 'react-redux'; // For Redux state and dispatch
import { useIntl } from 'react-intl'; // For internationalization
import PropTypes from 'prop-types'; // Can still be used for props if needed, but less critical here

import { fetchOrganization, updateOrganization } from 'mastodon/actions/organizations';
import { Column } from 'mastodon/components/column';
import { ColumnHeader } from 'mastodon/components/column_header';
import { Icon } from 'mastodon/components/icon'; // Assuming Icon can take a component directly
import { showAlert, showAlertForError } from 'mastodon/actions/alerts';
import { ColumnBackButton } from 'mastodon/components/column_back_button';

// SVG Icons (assuming SVGR setup like Vite's ?react)
import OrganizationIcon from '@/material-icons/400-24px/organizations-fill.svg?react';
import EditIcon from '@/material-icons/400-24px/edit.svg?react';

// Message descriptors for react-intl
const messages = {
    heading: { id: 'organization.edit_button', defaultMessage: 'Edit organization' },
    form_name: { id: 'create_organization_form.name', defaultMessage: 'Name' },
    form_description: { id: 'create_organization_form.description', defaultMessage: 'Description' },
    form_save: { id: 'organization.save_button', defaultMessage: 'Save' },
    form_save_success: { id: 'organization.saved_success', defaultMessage: 'Organization updated successfully' },
    loading: { id: 'organization.loading', defaultMessage: 'Loading organization...' },
    notFound: { id: 'organization.not_found', defaultMessage: 'Organization not found.' },
    saving: { id: 'organization.saving', defaultMessage: 'Saving...' },
};

const OrganizationEdit = () => {
    const { id: organizationId } = useParams(); // Get organization ID from URL
    const dispatch = useDispatch();
    const intl = useIntl();

    // Select organization data from Redux store
    const organizationData = useSelector(state => {
        const org = state.organizations?.get(organizationId); // Using optional chaining
        return org ? org.toJS() : null;
    });

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [avatarPreviewURL, setAvatarPreviewURL] = useState('');
    const [newAvatar, setNewAvatar] = useState(null); // To store the File object for the new avatar
    const [isSubmitting, setIsSubmitting] = useState(false); // For form submission loading state
    const [isFetching, setIsFetching] = useState(false); // For initial data fetching loading state

    // Effect to fetch organization data if not available in the store
    useEffect(() => {
        if (organizationId && !organizationData) {
            setIsFetching(true);
            dispatch(fetchOrganization(organizationId))
                .catch(error => {
                    // Optionally, dispatch an alert for fetch failure
                    console.error('Failed to fetch organization:', error);
                    // showAlertForError could be dispatched here if the action doesn't do it
                })
                .finally(() => setIsFetching(false));
        }
    }, [organizationId, organizationData, dispatch]);

    // Effect to populate form fields when organizationData is loaded or changes
    useEffect(() => {
        if (organizationData) {
            setName(organizationData.nameHtml ?? '');
            setDescription(organizationData.descriptionHtml ?? '');
            // Only update avatar preview from store if a new avatar hasn't been selected by the user
            if (!newAvatar) {
                setAvatarPreviewURL(organizationData.avatar ?? '');
            }
        } else {
            // Clear form if organizationData becomes null (e.g., navigating away or not found)
            setName('');
            setDescription('');
            setAvatarPreviewURL('');
            setNewAvatar(null);
        }
    }, [organizationData, newAvatar]); // newAvatar in dependencies to prevent overriding user's choice

    // Effect to revoke blob URL when component unmounts or URL changes
    useEffect(() => {
        // Current avatarPreviewURL might be a blob URL
        const currentUrl = avatarPreviewURL;
        return () => {
            if (currentUrl && currentUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentUrl);
            }
        };
    }, [avatarPreviewURL]);

    const handleNameChange = useCallback((e) => {
        setName(e.target.value);
    }, []);

    const handleDescriptionChange = useCallback((e) => {
        setDescription(e.target.value);
    }, []);

    const handleAvatarChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Revoke the previous blob URL if it exists, before creating a new one
        if (avatarPreviewURL && avatarPreviewURL.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreviewURL);
        }

        const newURL = URL.createObjectURL(file);
        setAvatarPreviewURL(newURL);
        setNewAvatar(file);
    }, [avatarPreviewURL]); // avatarPreviewURL is needed to revoke the old one

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!organizationId) return; // Should not happen if routing is correct

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);

        if (newAvatar) {
            formData.append('avatar', newAvatar);
        }

        setIsSubmitting(true);

        try {
            await dispatch(updateOrganization(organizationId, formData));
            dispatch(showAlert({
                message: intl.formatMessage(messages.form_save_success),
            }));
            // Optionally, you might want to clear newAvatar or refetch data
            setNewAvatar(null); // Clear the selected new avatar after successful upload
        } catch (error) {
            dispatch(showAlertForError({
                // Assuming error object might have a specific structure for message
                error: error.message || error,
            }));
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, organizationId, name, description, newAvatar, intl]);

    if (isFetching && !organizationData) {
        return (
            <Column label={intl.formatMessage(messages.heading)}>
                <ColumnBackButton />
                <ColumnHeader
                    title={intl.formatMessage(messages.heading)}
                    iconComponent={OrganizationIcon}
                />
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    {intl.formatMessage(messages.loading)}
                </div>
            </Column>
        );
    }

    if (!organizationData && !isFetching) {
        return (
            <Column label={intl.formatMessage(messages.heading)}>
                <ColumnBackButton />
                <ColumnHeader
                    title={intl.formatMessage(messages.heading)}
                    iconComponent={OrganizationIcon}
                />
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    {intl.formatMessage(messages.notFound)}
                </div>
            </Column>
        );
    }
    
    // Render nothing if organizationData is still null and not fetching (should be caught by above)
    if (!organizationData) return null;


    return (
        <Column label={intl.formatMessage(messages.heading)}>
            <ColumnBackButton />
            <ColumnHeader
                title={intl.formatMessage(messages.heading)}
                icon='building' // This refers to a pre-defined icon string in ColumnHeader
                iconComponent={OrganizationIcon} // This passes the actual SVG component
            />
            <div className="organization-edit" style={{ padding: '10px 15px' }}> {/* Added some padding */}
                <div className="organization-edit__heading" style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <label htmlFor="avatar-upload-input" className="organization-edit__avatar_holder" style={{ display: 'inline-block', position: 'relative', cursor: 'pointer' }}>
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            id="avatar-upload-input" // Changed ID to be more specific
                            onChange={handleAvatarChange}
                            disabled={isSubmitting || isFetching}
                        />
                        <img 
                            src={avatarPreviewURL || undefined} // Pass undefined if empty to avoid broken image icon for default
                            alt={name || 'Organization Avatar'} // Use current name state or default
                            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                        />
                        <div 
                            style={{ 
                                position: 'absolute', 
                                bottom: '5px', 
                                right: '5px', 
                                background: 'rgba(255,255,255,0.8)', 
                                borderRadius: '50%', 
                                padding: '5px' 
                            }}
                        >
                            <Icon icon={EditIcon} /> {/* Assuming Icon component can render EditIcon directly */}
                        </div>
                    </label>
                </div>

                <form className="organization-edit__form" onSubmit={handleSubmit}>
                    <div className="organization-edit__form-group" style={{ marginBottom: '15px' }}>
                        <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>
                            {intl.formatMessage(messages.form_name)}
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={handleNameChange}
                            required
                            disabled={isSubmitting || isFetching}
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div className="organization-edit__form-group" style={{ marginBottom: '15px' }}>
                        <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>
                            {intl.formatMessage(messages.form_description)}
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={handleDescriptionChange}
                            required
                            rows={4} // Added rows for better textarea default size
                            disabled={isSubmitting || isFetching}
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', resize: 'vertical' }}
                        />
                    </div>

                    <button
                        type='submit'
                        disabled={isSubmitting || isFetching || (!name || !description)} // Basic validation
                        style={{ padding: '10px 15px', cursor: (isSubmitting || isFetching) ? 'not-allowed' : 'pointer' }}
                    >
                        {isSubmitting ? intl.formatMessage(messages.saving) : intl.formatMessage(messages.form_save)}
                    </button>
                </form>
            </div>
        </Column>
    );
};

// PropTypes are removed as the component no longer directly receives these HOC-injected props.
// If this component were to accept props from a parent, you could define them here.

export default OrganizationEdit;