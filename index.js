const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/DoctorAppointment', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to the database'))
  .catch((error) => console.error('Connection error:', error));

// Define the User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['patient', 'doctor'] }
});

// Create the User model
const User = mongoose.model('User', userSchema);

// Define the UserProfile schema
const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bio: { type: String },
  phone: { type: String },
  availabilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Availability' },
  pricingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pricing' },
  bloodType: { type: String },
  gender: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Create the UserProfile model
const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// Define the Availability schema
const availabilitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true }
});

// Create the Availability model
const Availability = mongoose.model('Availability', availabilitySchema);

// Define the Pricing schema
const pricingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, required: true }
});

// Create the Pricing model
const Pricing = mongoose.model('Pricing', pricingSchema);

// Define the Patient schema
const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gender: { type: String, required: true },
  selectedDoctor: { type: String, required: true },
  selectedDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  price: { type: String, required: true }
});

// Create the Patient model
const Patient = mongoose.model('Patient', patientSchema);

// Define the Appointment schema
const appointmentSchema = new mongoose.Schema({
  user: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    gender: { type: String, required: true },
    photo: { type: String, required: true },
  },
  isPaid: { type: Boolean, default: false },
  ticketPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Create the Appointment model
const Appointment = mongoose.model('Appointment', appointmentSchema);

// Fetch all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Signup route
app.post('/api/signup', async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const newUser = new User({ name, email, password, role });

  try {
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ name: username, password });

    if (user) {
      res.status(200).json({ message: "Login successful" });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Profile update route
app.post('/api/updateProfile', async (req, res) => {
    const { email, name, password, bio, phone, startTime, endTime, price, bloodType, gender, fromDate, toDate } = req.body;
  
    try {
      // Find user by email
      let user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Update user details
      user.name = name;
      if (password) user.password = password; // Only update password if provided
  
      // Save updated user
      await user.save();
  
      // Find existing profile or create a new one
      let userProfile = await UserProfile.findOne({ userId: user._id });
      if (!userProfile) {
        userProfile = new UserProfile({ userId: user._id });
      }
  
      // Update profile details
      userProfile.bio = bio;
      userProfile.phone = phone;
      userProfile.bloodType = bloodType;
      userProfile.gender = gender;
  
      // Create or update availability
      let availability = await Availability.findOne({ userId: user._id });
      if (!availability) {
        availability = new Availability({ userId: user._id, startTime, endTime, fromDate: new Date(fromDate), toDate: new Date(toDate) });
      } else {
        availability.startTime = startTime;
        availability.endTime = endTime;
        availability.fromDate = new Date(fromDate);
        availability.toDate = new Date(toDate);
      }
  
      // Save the availability
      await availability.save();
  
      // Create or update pricing
      let pricing = await Pricing.findOne({ userId: user._id });
      if (!pricing) {
        pricing = new Pricing({ userId: user._id, price });
      } else {
        pricing.price = price;
      }
  
      // Save the pricing
      await pricing.save();
  
      // Update user profile references
      userProfile.availabilityId = availability._id;
      userProfile.pricingId = pricing._id;
  
      // Save the profile
      await userProfile.save();
  
      res.status(200).json({ message: 'Profile updated successfully', user, userProfile, availability, pricing });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });
  
// Route to handle storing patient information
app.post('/api/storePatientInfo', async (req, res) => {
  const { name, email, phone, gender, selectedDoctor, selectedDate, startTime, endTime, price } = req.body;

  try {
    // Create a new patient instance
    const newPatient = new Patient({
      name,
      email,
      phone,
      gender,
      selectedDoctor,
      selectedDate,
      startTime,
      endTime,
      price: price.toString() // Convert price to string
    });

    // Save the new patient information to the database
    await newPatient.save();

    // Respond with success message
    res.status(201).json({ message: 'Patient information stored successfully', patient: newPatient });
  } catch (error) {
    console.error('Error storing patient information:', error);
    res.status(500).json({ error: 'Failed to store patient information' });
  }
});

// Route to fetch all patient information
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.status(200).json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Route to fetch all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

const profileSchema = new mongoose.Schema({
    email: { type: String, required: true },
    phone: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true }
  });
  
  // Create the Profile model
  const Profile = mongoose.model('Profile', profileSchema);
  
  // Route to handle profile updates
  app.post('/api/Profile', async (req, res) => {
    const { email, phone, startTime, endTime, startDate, endDate } = req.body;
  
    try {
      // Find profile by email
      let profile = await Profile.findOne({ email });
  
      if (!profile) {
        // If profile not found, create a new one
        profile = new Profile({ email, phone, startTime, endTime, startDate, endDate });
      } else {
        // If profile found, update the fields
        profile.phone = phone;
        profile.startTime = startTime;
        profile.endTime = endTime;
        profile.startDate = startDate;
        profile.endDate = endDate;
      }
  
      // Save the profile
      await profile.save();
  
      res.status(200).json({ message: 'Profile updated successfully', profile });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });
  

  const contactSchema = new mongoose.Schema({
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true }
  });
  
  // Create the Contact model
  const Contact = mongoose.model('Contact', contactSchema);
  
  // Route to handle storing contact form submissions
  app.post('/api/contact', async (req, res) => {
    const { email, subject, message } = req.body;
  
    try {
      // Create a new contact form submission instance
      const newContact = new Contact({ email, subject, message });
  
      // Save the new contact form submission to the database
      await newContact.save();
  
      // Respond with success message
      res.status(201).json({ message: 'Contact form submission stored successfully', contact: newContact });
    } catch (error) {
      console.error('Error storing contact form submission:', error);
      res.status(500).json({ error: 'Failed to store contact form submission' });
    }
  });
  
// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
