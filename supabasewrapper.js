

const supabaseUrl = 'https://glzoxrgymuxkugtxezdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsem94cmd5bXV4a3VndHhlemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyNzY3NDEsImV4cCI6MjAzODg1Mjc0MX0.ZlCoNlHpB90VjACIjeO7E1u2sQ1qzSQqc7ww228Twg4';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
console.log('Supabase initialized:', supabaseClient);

/**
 * 
 * supabase wrapper. Should be callod on page load
 * 
 */
function supabaseWrapperOnload() {
    // Email Sign Up
    document.getElementById('email-sign-up-button').addEventListener('click', async () => {
        const email = document.getElementById('sign-up-email').value;
        const password = document.getElementById('sign-up-password').value;
        const {data, error} = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        if (error)
            console.error('Sign-up error:', error.message);
        else
            console.log('Sign-up data:', data);
    });

    // Email Sign In
    document.getElementById('email-sign-in-button').addEventListener('click', async () => {
        const email = document.getElementById('sign-in-email').value;
        const password = document.getElementById('sign-in-password').value;
        const {data, error} = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error)
            console.error('Sign-in error:', error.message);
        else
            console.log('Sign-in data:', data);
    });

    // Github Sign In
    document.getElementById('github-sign-in-button').addEventListener('click', async () => {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'github'
        });

        if (error)
            console.error('Sign-in error:', error.message);
        else
            console.log('Sign-in data:', data);
        checkSession()
    });

    // Define an async function to interact with the database
    document.getElementById('push-record-button').addEventListener('click', async () => {
        // Call checkSession periodically or after sign-in
        const cs_result = await new Promise((cs_resolve) => {
            cs_resolve(checkSession());
        });

        if (!cs_result) {
            document.getElementById('tab3').checked = true;
            console.log('Please authenticate first');
            return;
        }
            

        // Insert a new message into the messages table
        saveCommandSetTable();
        const controller_name_for_upload = document.getElementById("selectedControllerName").value;
        const command_set_for_upload = localStorage.getItem(COMMAND_SET_ROW_PREFIX + controller_name_for_upload);
        const { data, error } = await supabaseClient
            .from('lcdoledtftcontrollers')
            .insert(
                [{ controller_name: controller_name_for_upload, command_set: command_set_for_upload }]
            );

        if (error)
            console.error('Error inserting data:', error);
        else
            console.log('Data inserted:', data);

        // Retrieve the message from the messages table
        const { data: messages, error: fetchError } = await supabaseClient
            .from('lcdoledtftcontrollers')
            .select('*');

        if (fetchError)
            console.error('Error fetching data:', fetchError);
        else
            console.log('Fetched messages:', messages);
    });
}

/**
 * 
 * Check if the user is authenticated
 * @returns {Boolean}
 */
async function checkSession() {
    const {data: {session}, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error('Error fetching session:', error.message);
        return false;
    } else if (!session) {
        console.log('User not authenticated');
        return false;
    } else {
        console.log('User authenticated:', session.user);
        return true;
    }
}

