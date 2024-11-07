import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

userSchema.virtual('posts', {
    ref: 'Post',
    foreignField: 'userId',
    localField: '_id'
});
const User = mongoose.model('User', userSchema);
export default User;
