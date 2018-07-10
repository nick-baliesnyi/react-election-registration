# Generated by Django 2.0.7 on 2018-07-10 10:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('elists', '0002_auto_20180709_1952'),
    ]

    operations = [
        migrations.AlterField(
            model_name='checkinsession',
            name='status',
            field=models.CharField(choices=[('STARTED', 'Just STARTED'), ('IN_PROGRESS', 'Checking in'), ('CANCELED', 'Canceled'), ('COMPLETED', 'Completed')], default='STARTED', max_length=20),
        ),
    ]
