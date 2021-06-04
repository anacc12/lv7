var mongoose = require('mongoose');
var projectSchema = new mongoose.Schema(
    {
        vlasnik: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        naziv: String,
        opis: String,
        obavljeno: String,
        cijena: Number,
        pocetak: Date,
        zavrsetak: Date,
        arhivirano: {
            type: Boolean,
            default: false,
        },
        clanovi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
    { collection: 'projects' },
);

module.exports = mongoose.model('project', projectSchema);
