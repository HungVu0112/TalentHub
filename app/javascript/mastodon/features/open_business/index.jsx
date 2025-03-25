import { Helmet } from 'react-helmet';
import { defineMessages, useIntl } from 'react-intl'; // Using useIntl hook
import { useState, useCallback } from 'react'; // Using React hooks
import { useDispatch } from 'react-redux'; // Using useDispatch hook
import { useHistory } from 'react-router-dom'; // Using useHistory for navigation

import { createOrganization } from 'mastodon/actions/organizations';
import { showAlert, showAlertForError } from 'mastodon/actions/alerts';

// Define messages for react-intl
const messages = defineMessages({
    heading: { id: 'column.open_business', defaultMessage: 'Create organization' },
    pageTitle: { id: 'open_business.page_title', defaultMessage: 'Create New Organization' }, // Added a specific page title
    empty: { id: 'empty_column.open_business', defaultMessage: 'Looks like you haven\'t created any organization yet. Let’s create a new one!' }, // Corrected typo
    form_name: { id: 'create_organization_form.name', defaultMessage: 'Name' },
    form_description: { id: 'create_organization_form.description', defaultMessage: 'Description' },
    form_button: { id: 'create_organization_form.button_text', defaultMessage: 'Create' },
    form_fetching: { id: 'create_organization_form.fetching', defaultMessage: 'Creating...' },
    success_message: { id: 'create_organization_form.success_message', defaultMessage: 'Organization created successfully!' },
    error_message: { id: 'create_organization_form.error_message', defaultMessage: 'Error creating organization' },
    name_required: { id: 'create_organization_form.name_required', defaultMessage: 'Organization name is required.' }, // Added for form validation
});

const OpenBusiness = () => {
    const dispatch = useDispatch();
    const intl = useIntl();
    const history = useHistory(); // For programmatic navigation

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState(null); // For displaying errors within the form

    const handleNameChange = useCallback((e) => {
        setName(e.target.value);
        if (formError && e.target.value.trim()) { // Clear error when user starts typing a valid name
            setFormError(null);
        }
    }, [formError]);

    const handleDescriptionChange = useCallback((e) => {
        setDescription(e.target.value);
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setFormError(intl.formatMessage(messages.name_required));
            return;
        }
        setFormError(null); // Clear previous errors
        setIsLoading(true);

        try {
            const response = await dispatch(createOrganization({
                name,
                description,
            }));

            dispatch(showAlert({
                message: intl.formatMessage(messages.success_message),
            }));

            // Redirect to the newly created organization's page
            // Removed setTimeout for more immediate navigation, adjust if toast needs time
            if (response && response.id) {
                history.push(`/organization/${response.id}`);
            } else {
                // Fallback or error handling if response is not as expected
                console.warn('Organization created, but response did not include an ID for redirection.', response);
                // Optionally, redirect to a generic page or show a different message
            }

        } catch (error) {
            const errorMessage = error.response?.data?.error || intl.formatMessage(messages.error_message);
            setFormError(errorMessage); // Display error in form
            dispatch(showAlertForError({ // Also show a global alert
                error: errorMessage, // Pass the specific error message
            }));
            console.error('Organization Creation Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, intl, name, description, history]);

    return (
        <div className='open-business' style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
            <Helmet>
                <title>{intl.formatMessage(messages.pageTitle)}</title>
                <meta name='robots' content='noindex' />
            </Helmet>

            <div className='heading' style={{ textAlign: 'center', marginBottom: '24px' }}>
                {/* Changed the heading to be more direct for the form page */}
                <h1 style={{ fontSize: '1.8em', color: '#333' }}>{intl.formatMessage(messages.heading)}</h1>
                <p style={{ fontSize: '1em', color: '#666', marginTop: '8px' }}>{intl.formatMessage(messages.empty)}</p>
            </div>

            <form onSubmit={handleSubmit} className='create-organization-form'>
                {formError && (
                    <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center', border: '1px solid red', padding: '10px', borderRadius: '4px' }}>
                        {formError}
                    </div>
                )}

                <div className='form-group' style={{ marginBottom: '16px' }}>
                    <label htmlFor="name" style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                        {intl.formatMessage(messages.form_name)}
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={handleNameChange}
                        disabled={isLoading}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                        aria-describedby={formError && name.trim() === '' ? 'name-error' : undefined}
                    />
                    {formError && name.trim() === '' && <span id="name-error" style={{color: 'red', fontSize: '0.9em'}}>{formError}</span>}

                </div>

                <div className='form-group' style={{ marginBottom: '20px' }}>
                    <label htmlFor="description" style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                        {intl.formatMessage(messages.form_description)}
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={handleDescriptionChange}
                        disabled={isLoading}
                        required
                        rows={4}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading} 
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        backgroundColor: isLoading ? '#ccc' : '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        fontSize: '1em', 
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                >
                    {isLoading ? intl.formatMessage(messages.form_fetching) : intl.formatMessage(messages.form_button)}
                </button>
            </form>
        </div>
    );
};

// PropTypes are no longer needed here as props like dispatch and intl are accessed via hooks.
// If this component were to accept its own props from a parent, you could define them.

export default OpenBusiness;